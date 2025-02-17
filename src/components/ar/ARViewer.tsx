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
  const hasCheckedRef = useRef(false);

  const addStatusDetail = useCallback((detail: string) => {
    setDetailedStatus(prev => {
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

  const initializeAR = useCallback(async () => {
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
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error('Unknown error occurred');
      setStatus(`Error: ${err.message}`);
      onError?.(err);
    }
  }, [onStart, onEnd, onError]);

  const handleMotionPermissionClick = useCallback(async () => {
    try {
      const DeviceOrientationEventExt =
        DeviceOrientationEvent as unknown as ExtendedDeviceOrientationEventStatic;
      const permission = await DeviceOrientationEventExt.requestPermission?.();

      if (permission === 'granted') {
        setShowMotionPermissionButton(false);
        addStatusDetail('✓ Motion sensors granted');
        setIsARSupported(true);
        setARMode('arjs');
        void initializeAR();
      } else {
        addStatusDetail('❌ Motion sensor permission denied');
        setStatus('Motion Sensors Required');
      }
    } catch (error) {
      addStatusDetail('❌ Error requesting motion sensors');
      setStatus('Motion Sensors Required');
    }
  }, [addStatusDetail, initializeAR]);

  const checkDeviceSupport = useCallback(async () => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    try {
      clearStatus();
      // Check if mobile device
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
        return;
      }
      addStatusDetail('✓ Device supported');

      // Check camera access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        stream.getTracks().forEach(track => track.stop());
        addStatusDetail('✓ Camera access granted');
      } catch {
        setIsARSupported(false);
        setStatus('Camera Access Required');
        addStatusDetail('❌ Camera access denied');
        return;
      }

      // Check if iOS device
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        const DeviceOrientationEventExt =
          DeviceOrientationEvent as unknown as ExtendedDeviceOrientationEventStatic;
        if (typeof DeviceOrientationEventExt.requestPermission === 'function') {
          setShowMotionPermissionButton(true);
          setStatus('Motion Sensors Required');
          addStatusDetail('Tap "Allow Motion Sensors" to enable AR features');
          return;
        }
      }

      // For non-iOS devices or iOS devices without motion permission requirement
      setIsARSupported(true);
      setARMode(isIOS ? 'arjs' : 'webxr');
      void initializeAR();
    } catch (error) {
      setIsARSupported(false);
      setStatus('Initialization Failed');
      addStatusDetail(
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }, [addStatusDetail, clearStatus, initializeAR]);

  // Run device support check once on mount
  useEffect(() => {
    if (containerRef.current) {
      void checkDeviceSupport();
    }
    return cleanup;
  }, [checkDeviceSupport, cleanup]);

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
