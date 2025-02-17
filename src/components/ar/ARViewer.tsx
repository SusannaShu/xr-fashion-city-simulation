import React, { useEffect, useRef, useState } from 'react';
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

export const ARViewer: React.FC<ARViewerProps> = ({
  onStart,
  onEnd,
  onError,
  onBack,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [isReady, setIsReady] = useState(false);
  const [isARSupported, setIsARSupported] = useState<boolean | null>(null);
  const [arMode, setARMode] = useState<'webxr' | 'webrtc' | 'quicklook' | null>(
    null
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const checkARSupport = async () => {
      try {
        // First check if we're on mobile
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

        // Check for WebXR support first (best experience)
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
            console.warn('Error checking immersive-ar support:', e);
          }
        }

        // Check for iOS Safari Quick Look
        const isIOS =
          /iPad|iPhone|iPod/.test(navigator.userAgent) &&
          !(window as any).MSStream;
        const isSafari = /^((?!chrome|android).)*safari/i.test(
          navigator.userAgent
        );
        if (isIOS && isSafari) {
          setIsARSupported(true);
          setARMode('quicklook');
          return;
        }

        // Fallback to WebRTC-based AR if available
        if (
          'mediaDevices' in navigator &&
          'getUserMedia' in navigator.mediaDevices
        ) {
          setIsARSupported(true);
          setARMode('webrtc');
          return;
        }

        setIsARSupported(false);
        setStatus(
          'AR is not supported on this device. Try using Safari on iOS or Chrome on Android.'
        );
      } catch (error) {
        console.error('AR support check error:', error);
        setIsARSupported(false);
        setStatus(
          "Failed to check AR support. Please ensure you're using a compatible mobile device and browser."
        );
      }
    };

    void checkARSupport();

    if (!isARSupported || !arMode) return;

    const initialize = async () => {
      try {
        // Request necessary permissions
        setStatus('Requesting permissions...');
        const locationService = LocationService.getInstance();
        const hasPermissions = await locationService.requestPermissions();
        if (!hasPermissions) {
          throw new Error('Required permissions were not granted');
        }

        switch (arMode) {
          case 'webxr':
            await initializeWebXR();
            break;
          case 'quicklook':
            await initializeQuickLook();
            break;
          case 'webrtc':
            await initializeWebRTC();
            break;
        }

        setStatus('Ready - Tap the "Start AR" button to begin');
      } catch (error) {
        console.error('AR initialization error:', error);
        const err =
          error instanceof Error ? error : new Error('Unknown error occurred');
        setStatus(`Error: ${err.message}`);
        setIsReady(false);
        onError?.(err);
      }
    };

    // Only initialize if AR is supported and mode is determined
    if (isARSupported && arMode) {
      void initialize();
    }

    return () => {
      console.log('Cleaning up AR components...');
      cleanup();
    };
  }, [onStart, onEnd, onError]);

  const initializeWebXR = async () => {
    // Initialize AR engine
    setStatus('Initializing WebXR AR...');
    const arEngine = AREngine.getInstance();
    await arEngine.initialize({
      container: containerRef.current!,
      onStart: () => {
        console.log('AR session started successfully');
        setStatus('AR session started');
        setIsReady(true);
        onStart?.();
      },
      onEnd: () => {
        console.log('AR session ended');
        setStatus('AR session ended');
        setIsReady(false);
        onEnd?.();
      },
      onError: error => {
        console.error('AR error:', error);
        setStatus(`Error: ${error.message}`);
        setIsReady(false);
        onError?.(error);
      },
    });

    // Initialize services
    const drawingService = DrawingService.getInstance();
    const locationService = LocationService.getInstance();

    drawingService.initialize(arEngine.getScene());
    locationService.startTracking();

    // Load nearby models
    setStatus('Loading nearby models...');
    const nearbyModels = await locationService.getNearbyModels();
    await loadNearbyModels(nearbyModels);
  };

  const initializeQuickLook = async () => {
    // iOS-specific AR Quick Look initialization
    setStatus('Initializing iOS AR Quick Look...');
    // TODO: Implement iOS Quick Look specific initialization
  };

  const initializeWebRTC = async () => {
    // WebRTC-based AR initialization
    setStatus('Initializing camera-based AR...');
    // TODO: Implement WebRTC-based AR initialization
  };

  const cleanup = () => {
    const locationService = LocationService.getInstance();
    const drawingService = DrawingService.getInstance();
    const arEngine = AREngine.getInstance();

    locationService.stopTracking();
    drawingService.dispose();
    arEngine.dispose();
  };

  const loadNearbyModels = async (models: ModelMetadata[]) => {
    const arEngine = AREngine.getInstance();
    const locationService = LocationService.getInstance();

    for (const model of models) {
      try {
        // Load the model
        const processedModel: ProcessedModel = await loadModel(model);

        // Create spatial anchor for the model
        const anchor = await locationService.createSpatialAnchor(model.id);
        if (anchor) {
          // Place model using anchor data
          await arEngine.placeModel(processedModel, {
            position: new THREE.Vector3(
              anchor.orientation.alpha,
              anchor.orientation.beta,
              anchor.orientation.gamma
            ),
          });
        }
      } catch (error) {
        console.error(`Failed to load model ${model.id}:`, error);
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
              <>
                <p>
                  Your mobile device or browser does not support AR features.
                </p>
                <p>
                  Please use a device with AR capabilities (recent iPhone/iPad
                  with Safari or Android with Chrome).
                </p>
              </>
            ) : (
              <>
                <p>AR features are not available on desktop computers.</p>
                <p>
                  Please visit this page on your mobile device to use AR
                  features.
                </p>
              </>
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
