import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ARViewer.module.css';

// Extend JSX.IntrinsicElements using module augmentation
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': any;
      'a-entity': any;
      'a-light': any;
      'a-camera': any;
      'a-box': any;
      'a-sky': any;
      'a-plane': any;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */
/* eslint-enable @typescript-eslint/no-explicit-any */

interface ARViewerProps {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  onBack?: () => void;
}

export const ARViewer: React.FC<ARViewerProps> = ({
  onStart,
  onEnd,
  onError,
  onBack,
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the base URL for assets
  const getModelPath = () => {
    // const isProd = window.location.hostname !== 'localhost';
    // return isProd
    //   ? 'https://susu-virtual-space.web.app/models/susanna_heel.glb'
    //   : '/models/susanna_heel.glb';
    return 'https://res.cloudinary.com/sheyou/image/upload/v1749147965/compressed_Susanna_heel_235a465a45.glb'; // Always use relative path with correct casing
  };

  useEffect(() => {
    let mounted = true;

    const initAFrame = async () => {
      try {
        // Wait for A-Frame to be available
        if (!window.AFRAME) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (mounted) {
          setIsLoading(false);
          setIsSceneReady(true);
          setError(null);
          onStart?.();
        }
      } catch (error) {
        console.error('Failed to initialize A-Frame:', error);
        if (mounted) {
          setError('Failed to initialize A-Frame');
          onError?.(error);
        }
      }
    };

    void initAFrame();

    return () => {
      mounted = false;
      onEnd?.();
    };
  }, [onStart, onEnd, onError]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  const handleModelError = (e: any) => {
    console.error('Model loading error:', e);
    console.error('Attempted model path:', getModelPath());
    setError('Failed to load 3D model');
    onError?.(new Error('Failed to load 3D model'));
  };

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          {error}
          <button
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
          <button className={styles.backButton} onClick={handleBack}>
            ← Back to Map
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !isSceneReady) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading 3D Experience...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {isSceneReady && (
        <a-scene
          embedded
          renderer="logarithmicDepthBuffer: true; antialias: true; alpha: false; colorManagement: true;"
          vr-mode-ui="enabled: false"
          loading-screen="enabled: false"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
          }}
        >
          {/* Camera setup */}
          <a-entity position="0 1.6 0">
            <a-camera
              look-controls="reverseMouseDrag: false"
              wasd-controls
              fov="80"
            ></a-camera>
          </a-entity>

          {/* Background - Louvre Courtyard */}
          <a-sky
            src="https://api-www.louvre.fr/sites/default/files/2021-01/cour-napoleon-et-pyramide_1.jpg"
            rotation="0 -90 0"
            radius="100"
          ></a-sky>

          {/* Shoe model - massive sculpture style */}
          <a-entity
            position="0 -1 -15"
            scale="19 19 19"
            rotation="0 0 0"
            gltf-model={`${getModelPath()}?v=${new Date().getTime()}`}
            animation="property: rotation; to: 0 360 0; dur: 40000; easing: linear; loop: true"
            events={{
              error: handleModelError,
              loaded: () => console.log('Model loaded successfully'),
            }}
          ></a-entity>

          {/* Lighting - adjusted for better texture visibility */}
          <a-entity light="type: ambient; color: #FFF; intensity: 0.7"></a-entity>
          <a-entity
            light="type: directional; color: #FFF; intensity: 0.8; castShadow: true"
            position="-1 2 1"
          ></a-entity>
          <a-entity
            light="type: directional; color: #FFF; intensity: 0.8"
            position="1 2 -1"
          ></a-entity>
          <a-entity
            light="type: spot; color: #FFF; intensity: 0.5; angle: 45"
            position="0 8 -10"
          ></a-entity>
        </a-scene>
      )}

      <button className={styles.backButton} onClick={handleBack}>
        ← Back to Map
      </button>

      {/* <div className={styles.instructions}>
        Move around to view the shoe from different angles
      </div> */}
    </div>
  );
};

export default ARViewer;
