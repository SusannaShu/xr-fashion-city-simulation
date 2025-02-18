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

  useEffect(() => {
    let mounted = true;

    const loadAFrame = async () => {
      try {
        if (!window.AFRAME) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement(
              'script'
            ) as unknown as HTMLScriptElement;
            script.src = 'https://aframe.io/releases/1.4.0/aframe.min.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load A-Frame'));
            document.head.appendChild(script);
          });
        }

        // Wait for A-Frame to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (mounted) {
          setIsLoading(false);
          setIsSceneReady(true);
          setError(null);
          onStart?.();
        }
      } catch (error) {
        console.error('Failed to load A-Frame:', error);
        if (mounted) {
          setError('Failed to load A-Frame');
          onError?.(error);
        }
      }
    };

    void loadAFrame();

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
          renderer="logarithmicDepthBuffer: true; antialias: true; alpha: true; colorManagement: true;"
          vr-mode-ui="enabled: false"
          loading-screen="enabled: false"
        >
          {/* Camera setup */}
          <a-entity position="0 1.6 0">
            <a-camera look-controls wasd-controls></a-camera>
          </a-entity>

          {/* Shoe model - even larger */}
          <a-entity
            position="0 1.6 -2"
            scale="4 4 4"
            rotation="0 45 0"
            gltf-model="/models/susanna_heel.glb"
            animation="property: rotation; to: 0 405 0; dur: 15000; easing: linear; loop: true"
            events={{
              error: handleModelError,
              loaded: () => console.log('Model loaded successfully'),
            }}
          ></a-entity>

          {/* Lighting - adjusted for larger model */}
          <a-entity light="type: ambient; color: #FFF; intensity: 1.4"></a-entity>
          <a-entity
            light="type: directional; color: #FFF; intensity: 1.6; castShadow: true"
            position="-1 1 1"
          ></a-entity>
          <a-entity
            light="type: directional; color: #FFF; intensity: 1.6"
            position="1 1 -1"
          ></a-entity>
        </a-scene>
      )}

      <button className={styles.backButton} onClick={handleBack}>
        ← Back to Map
      </button>

      <div className={styles.instructions}>
        Move around to view the shoe from different angles
      </div>

      {/* Debug info */}
      <div
        className={styles.debug}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          fontSize: '12px',
        }}
      >
        Scene Ready: {isSceneReady ? 'Yes' : 'No'}
        <br />
        Model Path: /models/susanna_heel.glb
      </div>
    </div>
  );
};

export default ARViewer;
