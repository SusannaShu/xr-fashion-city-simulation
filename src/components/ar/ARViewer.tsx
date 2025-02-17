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
  const [hasCamera, setHasCamera] = useState(false);

  const addStatusDetail = useCallback((detail: string) => {
    setDetailedStatus(prev => [...prev, detail]);
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

  const handleMotionPermissionClick = useCallback(async () => {
    const DeviceOrientationEventExt =
      DeviceOrientationEvent as unknown as ExtendedDeviceOrientationEventStatic;

    try {
      const permission = await DeviceOrientationEventExt.requestPermission?.();
      if (permission === 'granted') {
        setShowMotionPermissionButton(false);
        addStatusDetail('✓ Motion sensors granted');
        setIsARSupported(true);

        // Determine AR mode
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          setARMode('arjs');
          addStatusDetail('✓ Using AR.js for iOS');
        } else if (navigator.xr) {
          try {
            const isImmersiveARSupported =
              await navigator.xr.isSessionSupported('immersive-ar');
            if (isImmersiveARSupported) {
              setARMode('webxr');
              addStatusDetail('✓ WebXR supported');
            } else {
              setARMode('arjs');
              addStatusDetail('✓ Using AR.js fallback');
            }
          } catch {
            setARMode('arjs');
            addStatusDetail('✓ Using AR.js fallback');
          }
        } else {
          setARMode('arjs');
          addStatusDetail('✓ Using AR.js fallback');
        }
      } else {
        addStatusDetail('❌ Motion sensor permission denied');
        setStatus('Motion Sensors Required');
      }
    } catch (error) {
      addStatusDetail('❌ Error requesting motion sensors');
      setStatus('Motion Sensors Required');
    }
  }, [addStatusDetail]);

  const checkARSupport = useCallback(async () => {
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
        return;
      }
      setHasCamera(true);
      addStatusDetail('✓ Camera access granted');

      // Check device orientation
      addStatusDetail('Checking motion sensors...');
      const hasMotionPermission = await requestMotionPermission();
      if (!hasMotionPermission) {
        setIsARSupported(false);
        setStatus('Motion Sensors Required');
        addStatusDetail('❌ Motion sensor access denied');
        return;
      }

      // If we get here with motion permission on iOS, we need to set up AR
      if (hasMotionPermission) {
        setIsARSupported(true);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          setARMode('arjs');
          addStatusDetail('✓ Using AR.js for iOS');
        } else if (navigator.xr) {
          try {
            const isImmersiveARSupported =
              await navigator.xr.isSessionSupported('immersive-ar');
            if (isImmersiveARSupported) {
              setARMode('webxr');
              addStatusDetail('✓ WebXR supported');
            } else {
              setARMode('arjs');
              addStatusDetail('✓ Using AR.js fallback');
            }
          } catch {
            setARMode('arjs');
            addStatusDetail('✓ Using AR.js fallback');
          }
        } else {
          setARMode('arjs');
          addStatusDetail('✓ Using AR.js fallback');
        }
      }
    } catch (error) {
      setIsARSupported(false);
      setStatus('Initialization Failed');
      addStatusDetail(
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }, [addStatusDetail, clearStatus, checkCameraAccess]);

  const initializeWebXR = useCallback(async () => {
    setStatus('Initializing WebXR AR...');
    const arEngine = AREngine.getInstance();
    await arEngine.initialize({
      container: containerRef.current ?? document.createElement('div'),
      onStart: () => {
        setStatus('AR session started');
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

    const drawingService = DrawingService.getInstance();
    const locationService = LocationService.getInstance();

    drawingService.initialize(arEngine.getScene());
    locationService.startTracking();

    setStatus('Loading nearby models...');
    const nearbyModels = await locationService.getNearbyModels();
    await loadNearbyModels(nearbyModels);
  }, [onStart, onEnd, onError]);

  const initializeARjs = useCallback(async () => {
    setStatus('Initializing location-based AR...');
    const arEngine = AREngine.getInstance();
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

    const drawingService = DrawingService.getInstance();
    const locationService = LocationService.getInstance();

    drawingService.initialize(arEngine.getScene());
    await locationService.startTracking();
  }, [onStart, onEnd, onError]);

  const initializeWebRTC = useCallback(async () => {
    setStatus('Initializing camera-based AR...');

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: window.innerWidth },
        height: { ideal: window.innerHeight },
      },
    });

    const video = document.createElement('video');
    const videoElement = video as unknown as HTMLVideoElement;
    videoElement.srcObject = stream;
    videoElement.className = styles.cameraFeed;
    videoElement.playsInline = true;
    videoElement.autoplay = true;
    containerRef.current?.appendChild(videoElement);

    const drawingService = DrawingService.getInstance();
    const locationService = LocationService.getInstance();

    await locationService.startTracking();

    const canvas = document.createElement('canvas');
    const canvasElement = canvas as unknown as HTMLCanvasElement;
    canvasElement.className = styles.drawingOverlay;
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    containerRef.current?.appendChild(canvasElement);

    drawingService.initialize(canvasElement, true);

    setStatus('Ready - Tap to start drawing');
    onStart?.();

    return () => {
      stream.getTracks().forEach(track => track.stop());
      videoElement.remove();
      canvasElement.remove();
    };
  }, [onStart]);

  useEffect(() => {
    if (!containerRef.current) return;

    void checkARSupport();

    if (!isARSupported || !arMode) return;

    const initialize = async () => {
      try {
        switch (arMode) {
          case 'webxr':
            await initializeWebXR();
            break;
          case 'arjs':
            await initializeARjs();
            break;
          case 'webrtc':
            await initializeWebRTC();
            break;
          case 'quicklook':
            // TODO: Implement iOS Quick Look
            break;
        }
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error('Unknown error occurred');
        setStatus(`Error: ${err.message}`);
        onError?.(err);
      }
    };

    void initialize();

    return cleanup;
  }, [
    isARSupported,
    arMode,
    initializeWebXR,
    initializeARjs,
    initializeWebRTC,
    onError,
    cleanup,
    checkARSupport,
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
