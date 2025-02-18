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
      'a-assets': any;
      'a-asset-item': any;
      'a-sky': any;
      'a-box': any;
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
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadAFrame = async () => {
      try {
        if (!window.AFRAME) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
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

  const handleAssetsLoaded = () => {
    console.log('Assets loaded successfully');
    setAssetsLoaded(true);
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
          renderer="logarithmicDepthBuffer: true; antialias: true; alpha: true"
          vr-mode-ui="enabled: false"
          loading-screen="enabled: false"
        >
          {/* Camera with webcam background */}
          <a-entity
            id="camera"
            camera
            position="0 1.6 0"
            wasd-controls
            look-controls
          >
            <a-entity
              geometry="primitive: plane; width: 160; height: 90;"
              material="shader: flat; src: #webcam; transparent: true; opacity: 1"
              position="0 0 -100"
              scale="-1 1 1"
            ></a-entity>
          </a-entity>

          <a-assets timeout="30000" onLoad={handleAssetsLoaded}>
            {/* Add webcam video element */}
            <video
              id="webcam"
              autoPlay
              playsInline
              style={{ display: 'none' }}
            ></video>

            {/* 3D model */}
            <a-asset-item
              id="shoe-model"
              src="/models/susanna_heel.glb"
              response-type="arraybuffer"
              crossorigin="anonymous"
            ></a-asset-item>
          </a-assets>

          {/* Shoe model */}
          <a-entity
            gltf-model="#shoe-model"
            position="0 0 -2"
            scale="0.5 0.5 0.5"
            rotation="0 45 0"
            animation="property: rotation; to: 0 405 0; dur: 15000; easing: linear; loop: true"
            events={{
              error: handleModelError,
              loaded: () => console.log('Model loaded successfully'),
            }}
          ></a-entity>

          {/* Lighting */}
          <a-entity light="type: ambient; color: #FFF; intensity: 0.8"></a-entity>
          <a-entity
            light="type: directional; color: #FFF; intensity: 1"
            position="-0.5 1 1"
          ></a-entity>
        </a-scene>
      )}

      <button className={styles.backButton} onClick={handleBack}>
        ← Back to Map
      </button>

      <div className={styles.instructions}>
        {!assetsLoaded
          ? 'Loading model...'
          : 'Move your device to view the shoe from different angles'}
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
        Assets Loaded: {assetsLoaded ? 'Yes' : 'No'}
        <br />
        Model Path: /models/susanna_heel.glb
      </div>
    </div>
  );
};

export default ARViewer;
