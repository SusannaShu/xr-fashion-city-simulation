import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { AREngine } from '../../services/ar/arEngine';
import { LocationService } from '../../services/ar/locationService';
import { DrawingService } from '../../services/ar/drawingService';
import { ProcessedModel } from '../../services/model/ModelTransformer';
import { ModelMetadata } from '../../services/firebase/metadata';
import styles from './ARViewer.module.css';

interface ARViewerProps {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  onBack?: () => void;
}

type ARMode = 'webxr' | 'webrtc' | 'quicklook' | 'arjs' | null;

// Extended DeviceOrientationEvent type
interface ExtendedDeviceOrientationEventStatic {
  new (): DeviceOrientationEvent;
  prototype: DeviceOrientationEvent;
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export const ARViewer: React.FC<ARViewerProps> = ({
  onStart,
  onEnd,
  onError,
  onBack,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [detailedStatus, setDetailedStatus] = useState<string[]>([]);
  const [isARSupported, setIsARSupported] = useState<boolean | null>(null);
  const [arMode, setARMode] = useState<ARMode>(null);
  const [showMotionPermissionButton, setShowMotionPermissionButton] =
    useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const addStatusDetail = useCallback((detail: string) => {
    setDetailedStatus(prev => {
      // Prevent duplicate messages
      if (prev[prev.length - 1] === detail) return prev;
      return [...prev, detail];
    });
  }, []);

  const clearStatus = useCallback(() => {
    setDetailedStatus([]);
  }, []);

  const cleanup = useCallback(() => {
    const locationService = LocationService.getInstance();
    const drawingService = DrawingService.getInstance();
    const arEngine = AREngine.getInstance();

    locationService.stopTracking();
    drawingService.dispose();
    arEngine.dispose();
  }, []);

  const checkCameraAccess = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  function requestMotionPermission(): Promise<boolean> {
    if (typeof DeviceOrientationEvent === 'undefined') {
      return Promise.resolve(true);
    }

    const DeviceOrientationEventExt =
      DeviceOrientationEvent as unknown as ExtendedDeviceOrientationEventStatic;

    // For iOS devices
    if (typeof DeviceOrientationEventExt.requestPermission === 'function') {
      setShowMotionPermissionButton(true);
      setStatus('Motion Sensors Required');
      addStatusDetail('Tap "Allow Motion Sensors" to enable AR features');
      return Promise.resolve(false);
    }

    // For non-iOS devices, check if motion data is available
    return new Promise(resolve => {
      const checkMotion = (event: DeviceOrientationEvent) => {
        window.removeEventListener('deviceorientation', checkMotion);
        resolve(
          event.alpha !== null || event.beta !== null || event.gamma !== null
        );
      };
      window.addEventListener('deviceorientation', checkMotion, { once: true });
      // Timeout after 1 second if no motion event is received
      setTimeout(() => resolve(false), 1000);
    });
  }

  const initializeAR = useCallback(async () => {
    if (isInitializing) return;
    setIsInitializing(true);

    try {
      const arEngine = AREngine.getInstance();
      const drawingService = DrawingService.getInstance();
      const locationService = LocationService.getInstance();

      await arEngine.initialize({
        container: containerRef.current ?? document.createElement('div'),
        onStart: () => {
          setStatus('AR session active - Move your phone to draw in space');
          onStart?.();
        },
        onEnd: () => {
          setStatus('AR session ended');
          onEnd?.();
        },
        onError: error => {
          setStatus(`Error: ${error.message}`);
          onError?.(error);
        },
      });

      drawingService.initialize(arEngine.getScene());
      await locationService.startTracking();

      setIsInitializing(false);
    } catch (error) {
      setIsInitializing(false);
      const err =
        error instanceof Error ? error : new Error('Unknown error occurred');
      setStatus(`Error: ${err.message}`);
      onError?.(err);
    }
  }, [onStart, onEnd, onError, isInitializing]);

  const handleMotionPermissionClick = useCallback(async () => {
    if (isInitializing) return;

    const DeviceOrientationEventExt =
      DeviceOrientationEvent as unknown as ExtendedDeviceOrientationEventStatic;

    try {
      const permission = await DeviceOrientationEventExt.requestPermission?.();
      if (permission === 'granted') {
        setShowMotionPermissionButton(false);
        addStatusDetail('✓ Motion sensors granted');
        setIsARSupported(true);
        setARMode('arjs');
        addStatusDetail('✓ Using AR.js for iOS');
      } else {
        addStatusDetail('❌ Motion sensor permission denied');
        setStatus('Motion Sensors Required');
      }
    } catch (error) {
      addStatusDetail('❌ Error requesting motion sensors');
      setStatus('Motion Sensors Required');
    }
  }, [addStatusDetail, isInitializing]);

  const checkARSupport = useCallback(async () => {
    if (isInitializing) return;
    setIsInitializing(true);

    try {
      clearStatus();
      addStatusDetail('Checking device compatibility...');
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      if (!isMobile) {
        setIsARSupported(false);
        setStatus('AR Not Supported');
        addStatusDetail(
          '❌ Device not supported: AR features are only available on mobile devices'
        );
        setIsInitializing(false);
        return;
      }
      addStatusDetail('✓ Device supported');

      // Check camera access
      addStatusDetail('Requesting camera access...');
      const hasCameraAccess = await checkCameraAccess();
      if (!hasCameraAccess) {
        setIsARSupported(false);
        setStatus('Camera Access Required');
        addStatusDetail('❌ Camera access denied');
        setIsInitializing(false);
        return;
      }
      addStatusDetail('✓ Camera access granted');

      // Check device orientation
      addStatusDetail('Checking motion sensors...');
      const hasMotionPermission = await requestMotionPermission();
      if (!hasMotionPermission) {
        setIsARSupported(false);
        setStatus('Motion Sensors Required');
        addStatusDetail('❌ Motion sensor access denied');
        setIsInitializing(false);
        return;
      }

      // If we get here with motion permission, we can start AR
      if (hasMotionPermission) {
        setIsARSupported(true);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setARMode(isIOS ? 'arjs' : 'webxr');
        addStatusDetail(`✓ Using ${isIOS ? 'AR.js for iOS' : 'WebXR'}`);
      }

      setIsInitializing(false);
    } catch (error) {
      setIsARSupported(false);
      setStatus('Initialization Failed');
      addStatusDetail(
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setIsInitializing(false);
    }
  }, [addStatusDetail, clearStatus, checkCameraAccess, isInitializing]);

  useEffect(() => {
    if (!containerRef.current || isInitializing) return;

    if (!isARSupported && !showMotionPermissionButton) {
      void checkARSupport();
    } else if (isARSupported && arMode && !showMotionPermissionButton) {
      void initializeAR();
    }
  }, [
    isARSupported,
    arMode,
    showMotionPermissionButton,
    checkARSupport,
    initializeAR,
    isInitializing,
  ]);

  const loadNearbyModels = async (models: ModelMetadata[]) => {
    const arEngine = AREngine.getInstance();
    const locationService = LocationService.getInstance();

    for (const model of models) {
      try {
        const processedModel: ProcessedModel = await loadModel(model);
        const anchor = await locationService.createSpatialAnchor(model.id);
        if (anchor) {
          await arEngine.placeModel(processedModel, {
            position: new THREE.Vector3(
              anchor.orientation.alpha,
              anchor.orientation.beta,
              anchor.orientation.gamma
            ),
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          setStatus(`Error loading model: ${error.message}`);
        }
      }
    }
  };

  return (
    <div ref={containerRef} className={styles.container}>
      <div
        className={styles.statusOverlay}
        style={{
          display:
            !isARSupported || showMotionPermissionButton ? 'flex' : 'none',
        }}
      >
        <h2>{status}</h2>
        <div className={styles.statusDetails}>
          {detailedStatus.map((detail, index) => (
            <p key={index}>{detail}</p>
          ))}
        </div>
        {showMotionPermissionButton && (
          <button
            className={styles.permissionButton}
            onClick={handleMotionPermissionClick}
            disabled={isInitializing}
          >
            Allow Motion Sensors
          </button>
        )}
        <button className={styles.backButton} onClick={onBack}>
          Back to Map
        </button>
      </div>
    </div>
  );
};

// Helper function to load a model (to be implemented)
async function loadModel(metadata: ModelMetadata): Promise<ProcessedModel> {
  // This will be implemented when we create the ModelLoader component
  throw new Error('Not implemented');
}

export default ARViewer;
