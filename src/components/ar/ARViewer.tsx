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
  const [isARSupported, setIsARSupported] = useState<boolean | null>(null);
  const [arMode, setARMode] = useState<ARMode>(null);

  const cleanup = useCallback(() => {
    const locationService = LocationService.getInstance();
    const drawingService = DrawingService.getInstance();
    const arEngine = AREngine.getInstance();

    locationService.stopTracking();
    drawingService.dispose();
    arEngine.dispose();
  }, []);

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

  const requestMotionPermission = useCallback(async (): Promise<boolean> => {
    if (typeof DeviceOrientationEvent === 'undefined') {
      return true;
    }

    const DeviceOrientationEventExt =
      DeviceOrientationEvent as unknown as ExtendedDeviceOrientationEventStatic;

    // For iOS devices
    if (typeof DeviceOrientationEventExt.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEventExt.requestPermission();
        return permission === 'granted';
      } catch (e) {
        // If request fails, check if we can get motion data anyway
        return new Promise(resolve => {
          const checkMotion = (event: DeviceOrientationEvent) => {
            window.removeEventListener('deviceorientation', checkMotion);
            resolve(
              event.alpha !== null ||
                event.beta !== null ||
                event.gamma !== null
            );
          };
          window.addEventListener('deviceorientation', checkMotion, {
            once: true,
          });
        });
      }
    }

    // For non-iOS devices, motion sensors are usually available by default
    return true;
  }, []);

  const checkARSupport = useCallback(async () => {
    try {
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      if (!isMobile) {
        setIsARSupported(false);
        setStatus(
          'AR features are only available on mobile devices. Please access this feature from your phone or tablet.'
        );
        return;
      }

      // Check camera access first
      let hasCamera = false;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        stream.getTracks().forEach(track => track.stop());
        hasCamera = true;
      } catch (e) {
        setIsARSupported(false);
        setStatus('Please allow camera access to use AR');
        return;
      }

      // If we have camera access, check for device orientation
      if (hasCamera) {
        const hasMotionPermission = await requestMotionPermission();

        if (!hasMotionPermission) {
          setIsARSupported(false);
          setStatus('Tap here to enable AR');
          return;
        }

        // For iOS devices, use AR.js regardless of browser
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          setIsARSupported(true);
          setARMode('arjs');
          return;
        }

        // For Android, try WebXR first
        if (navigator.xr) {
          try {
            const isImmersiveARSupported =
              await navigator.xr.isSessionSupported('immersive-ar');
            if (isImmersiveARSupported) {
              setIsARSupported(true);
              setARMode('webxr');
              return;
            }
          } catch (e) {
            // Continue to AR.js if WebXR fails
          }
        }

        // Fallback to AR.js for all other cases
        setIsARSupported(true);
        setARMode('arjs');
        return;
      }

      setIsARSupported(false);
      setStatus('Unable to start AR. Please try again.');
    } catch (error) {
      setIsARSupported(false);
      setStatus('Unable to start AR. Please try again.');
    }
  }, [requestMotionPermission]);

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

    if (isARSupported && arMode) {
      void initialize();
    }

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
    <div className={styles.container} ref={containerRef}>
      <div className={styles.statusOverlay}>
        {status}
        {!isARSupported && (
          <div className={styles.notSupportedMessage}>
            {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              navigator.userAgent
            ) ? (
              <button
                className={styles.permissionButton}
                onClick={() => void checkARSupport()}
              >
                Start AR
              </button>
            ) : (
              <p>Please open this page on your mobile device</p>
            )}
            <button className={styles.backButton} onClick={onBack}>
              Back to Map
            </button>
          </div>
        )}
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
