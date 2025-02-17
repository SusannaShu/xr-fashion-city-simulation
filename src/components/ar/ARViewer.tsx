import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  Suspense,
} from 'react';
import * as THREE from 'three';
import { AREngine } from '../../services/ar/arEngine';
import { LocationService } from '../../services/ar/locationService';
import { DrawingService } from '../../services/ar/drawingService';
import { ProcessedModel } from '../../services/model/ModelTransformer';
import { ModelMetadata } from '../../services/firebase/metadata';
import styles from './ARViewer.module.css';

// Lazy load the AR Scene component
const ARScene = React.lazy(() => import('./ARScene'));

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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const hasCheckedRef = useRef(false);

  // Development mode detection
  const isDev = process.env.NODE_ENV === 'development';
  const isSimulatedMobile =
    isDev && new URLSearchParams(window.location.search).has('simulateMobile');

  const logDebug = useCallback(
    (message: string) => {
      if (isDev) {
        console.log(`[AR Debug] ${message}`);
      }
    },
    [isDev]
  );

  const addStatusDetail = useCallback(
    (detail: string) => {
      logDebug(detail);
      setDetailedStatus(prev => {
        if (prev[prev.length - 1] === detail) return prev;
        return [...prev, detail];
      });
    },
    [logDebug]
  );

  const clearStatus = useCallback(() => {
    setDetailedStatus([]);
    setDebugInfo([]);
  }, []);

  const cleanup = useCallback(() => {
    logDebug('Cleaning up AR resources');
    const locationService = LocationService.getInstance();
    const drawingService = DrawingService.getInstance();
    const arEngine = AREngine.getInstance();

    locationService.stopTracking();
    drawingService.dispose();
    arEngine.dispose();
  }, [logDebug]);

  const initializeAR = useCallback(async () => {
    try {
      logDebug('Initializing AR...');
      const arEngine = AREngine.getInstance();
      const drawingService = DrawingService.getInstance();
      const locationService = LocationService.getInstance();

      logDebug('Initializing AR engine...');
      await arEngine.initialize({
        container: containerRef.current ?? document.createElement('div'),
        onStart: () => {
          logDebug('AR session started');
          setStatus('AR session active - Move your phone to draw in space');
          onStart?.();
        },
        onEnd: () => {
          logDebug('AR session ended');
          setStatus('AR session ended');
          onEnd?.();
        },
        onError: error => {
          logDebug(`AR error: ${error.message}`);
          setStatus(`Error: ${error.message}`);
          onError?.(error);
        },
      });

      logDebug('Initializing drawing service...');
      drawingService.initialize(arEngine.getScene());

      logDebug('Starting location tracking...');
      await locationService.startTracking();

      logDebug('AR initialization complete');
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error('Unknown error occurred');
      logDebug(`AR initialization failed: ${err.message}`);
      setStatus(`Error: ${err.message}`);
      onError?.(err);
    }
  }, [onStart, onEnd, onError, logDebug]);

  const handleMotionPermissionClick = useCallback(async () => {
    try {
      logDebug('Requesting motion permission...');
      const DeviceOrientationEventExt =
        DeviceOrientationEvent as unknown as ExtendedDeviceOrientationEventStatic;

      if (isSimulatedMobile) {
        logDebug('Simulating granted motion permission');
        setShowMotionPermissionButton(false);
        addStatusDetail('✓ Motion sensors granted (simulated)');
        setIsARSupported(true);
        setARMode('arjs');
        void initializeAR();
        return;
      }

      const permission = await DeviceOrientationEventExt.requestPermission?.();
      logDebug(`Motion permission result: ${permission}`);

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
      logDebug(`Motion permission error: ${error}`);
      addStatusDetail('❌ Error requesting motion sensors');
      setStatus('Motion Sensors Required');
    }
  }, [addStatusDetail, initializeAR, isSimulatedMobile, logDebug]);

  const checkDeviceSupport = useCallback(async () => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    try {
      clearStatus();
      logDebug('Checking device support...');

      // In development, allow simulated mobile
      const isMobile =
        isSimulatedMobile ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      logDebug(
        `Device check - Mobile: ${isMobile}, Simulated: ${isSimulatedMobile}`
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
        logDebug('Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        stream.getTracks().forEach(track => track.stop());
        addStatusDetail('✓ Camera access granted');
      } catch (error) {
        logDebug(`Camera access error: ${error}`);
        setIsARSupported(false);
        setStatus('Camera Access Required');
        addStatusDetail('❌ Camera access denied');
        return;
      }

      // Check if iOS device or simulated
      const isIOS =
        isSimulatedMobile || /iPad|iPhone|iPod/.test(navigator.userAgent);
      logDebug(`Device check - iOS: ${isIOS}, Simulated: ${isSimulatedMobile}`);

      if (isIOS) {
        const DeviceOrientationEventExt =
          DeviceOrientationEvent as unknown as ExtendedDeviceOrientationEventStatic;
        if (
          typeof DeviceOrientationEventExt.requestPermission === 'function' ||
          isSimulatedMobile
        ) {
          setShowMotionPermissionButton(true);
          setStatus('Motion Sensors Required');
          addStatusDetail('Tap "Allow Motion Sensors" to enable AR features');
          return;
        }
      }

      // For non-iOS devices or iOS devices without motion permission requirement
      logDebug('No motion permission required, proceeding with AR');
      setIsARSupported(true);
      setARMode(isIOS ? 'arjs' : 'webxr');
      void initializeAR();
    } catch (error) {
      logDebug(`Device support check error: ${error}`);
      setIsARSupported(false);
      setStatus('Initialization Failed');
      addStatusDetail(
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }, [addStatusDetail, clearStatus, initializeAR, isSimulatedMobile, logDebug]);

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
      {isARSupported && !showMotionPermissionButton && (
        <Suspense fallback={<div>Loading AR...</div>}>
          <ARScene />
        </Suspense>
      )}

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
