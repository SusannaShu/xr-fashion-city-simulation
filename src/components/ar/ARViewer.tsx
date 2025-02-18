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

    const createScript = (src: string): HTMLScriptElement => {
      const element = document.createElement('script');
      const script = element as unknown as HTMLScriptElement;
      script.src = src;
      script.async = true;
      script.crossOrigin = 'anonymous';
      return script;
    };

    const loadScripts = async () => {
      try {
        // Check if A-Frame is already loaded
        if (window.AFRAME) {
          console.log('A-Frame already loaded');
          setIsLoading(false);
          setIsSceneReady(true);
          onStart?.();
          return;
        }

        // Try loading from multiple CDNs
        const cdnUrls = [
          'https://unpkg.com/aframe@1.4.0/dist/aframe-master.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/aframe/1.4.0/aframe.min.js',
          'https://cdn.jsdelivr.net/npm/aframe@1.4.0/dist/aframe.min.js',
        ];

        let loaded = false;
        for (const url of cdnUrls) {
          if (loaded) break;

          try {
            await new Promise<void>((resolve, reject) => {
              const script = createScript(url);
              script.onload = () => {
                if (mounted) {
                  console.log('A-Frame loaded successfully from:', url);
                  loaded = true;
                  resolve();
                }
              };
              script.onerror = () => {
                console.warn('Failed to load A-Frame from:', url);
                reject(new Error(`Failed to load A-Frame from ${url}`));
              };
              document.head.appendChild(script);
            });
          } catch (e) {
            console.warn('Error loading from CDN:', url, e);
            continue;
          }
        }

        if (!loaded) {
          throw new Error('Failed to load A-Frame from all CDN sources');
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
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Unknown error loading A-Frame';
        setError(errorMessage);
        if (mounted) {
          onError?.(error);
        }
      }
    };

    void loadScripts();

    return () => {
      mounted = false;
      const scripts = document.querySelectorAll('script[src*="aframe"]');
      scripts.forEach(script => script.remove());
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
        <div className={styles.loadingText}>Loading AR Experience...</div>
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
          arjs="sourceType: webcam; debugUIEnabled: false; trackingMethod: best; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
        >
          <a-assets timeout="30000">
            <a-asset-item
              id="shoe-model"
              src="/models/susanna_heel.glb"
              response-type="arraybuffer"
              crossorigin="anonymous"
            ></a-asset-item>
          </a-assets>

          {/* Camera setup with AR.js */}
          <a-entity camera></a-entity>

          {/* Shoe model - positioned in front of camera */}
          <a-entity
            gltf-model="#shoe-model"
            position="0 0 -2"
            scale="0.5 0.5 0.5"
            rotation="0 45 0"
            animation="property: rotation; to: 0 405 0; dur: 15000; easing: linear; loop: true"
            events={{
              error: (e: any) => {
                console.error('Model loading error:', e);
                onError?.(new Error('Failed to load 3D model'));
              },
            }}
          ></a-entity>

          {/* Ambient light for better visibility */}
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
        Point your camera at an open space to see the shoe model
      </div>
    </div>
  );
};

export default ARViewer;
