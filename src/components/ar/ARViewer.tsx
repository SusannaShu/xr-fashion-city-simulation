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

  useEffect(() => {
    if (!containerRef.current) return;

    const checkARSupport = async () => {
      try {
        if (!navigator.xr) {
          setIsARSupported(false);
          setStatus('AR is not supported on this device');
          return;
        }
        const isSupported = await navigator.xr.isSessionSupported(
          'immersive-ar'
        );
        setIsARSupported(isSupported);
        if (!isSupported) {
          setStatus('AR is not supported on this device');
        }
      } catch (error) {
        setIsARSupported(false);
        setStatus('Failed to check AR support');
      }
    };

    void checkARSupport();

    if (!isARSupported) return;

    const arEngine = AREngine.getInstance();
    const locationService = LocationService.getInstance();
    const drawingService = DrawingService.getInstance();

    const initialize = async () => {
      try {
        // Request necessary permissions
        setStatus('Requesting permissions...');
        const hasPermissions = await locationService.requestPermissions();
        if (!hasPermissions) {
          throw new Error('Required permissions were not granted');
        }

        // Initialize AR engine
        setStatus('Initializing AR...');
        await arEngine.initialize({
          container: containerRef.current!,
          onStart: () => {
            setStatus('AR session started');
            setIsReady(true);
            onStart?.();
          },
          onEnd: () => {
            setStatus('AR session ended');
            setIsReady(false);
            onEnd?.();
          },
          onError: error => {
            setStatus(`Error: ${error.message}`);
            onError?.(error);
          },
        });

        // Start location tracking
        locationService.startTracking();

        // Initialize drawing service with AR scene
        drawingService.initialize(arEngine.getScene());

        // Load nearby models
        setStatus('Loading nearby models...');
        const nearbyModels = await locationService.getNearbyModels();
        await loadNearbyModels(nearbyModels);

        setStatus('Ready');
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error('Unknown error occurred');
        setStatus(`Error: ${err.message}`);
        onError?.(err);
      }
    };

    initialize();

    return () => {
      locationService.stopTracking();
      drawingService.dispose();
      arEngine.dispose();
    };
  }, [onStart, onEnd, onError]);

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
            <p>Your device or browser does not support AR features.</p>
            <p>Try using a mobile device with AR capabilities.</p>
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
