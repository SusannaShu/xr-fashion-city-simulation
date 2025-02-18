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
      'a-marker': any;
      'a-assets': any;
      'a-asset-item': any;
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

  useEffect(() => {
    let mounted = true;

    const createScript = (src: string): HTMLScriptElement => {
      const element = document.createElement('script');
      const script = element as unknown as HTMLScriptElement;
      script.src = src;
      script.async = true;
      return script;
    };

    const loadScripts = async () => {
      try {
        // Load A-Frame first
        await new Promise<void>((resolve, reject) => {
          const script = createScript(
            'https://aframe.io/releases/1.4.0/aframe.min.js'
          );
          script.onload = () => {
            if (mounted) {
              console.log('A-Frame loaded successfully');
              resolve();
            }
          };
          script.onerror = e => {
            console.error('Failed to load A-Frame:', e);
            reject(new Error('Failed to load A-Frame'));
          };
          document.head.appendChild(script);
        });

        // Wait a bit for A-Frame to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Then load AR.js
        await new Promise<void>((resolve, reject) => {
          const script = createScript(
            'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js'
          );
          script.onload = () => {
            if (mounted) {
              console.log('AR.js loaded successfully');
              resolve();
            }
          };
          script.onerror = e => {
            console.error('Failed to load AR.js:', e);
            reject(new Error('Failed to load AR.js'));
          };
          document.head.appendChild(script);
        });

        // Wait for everything to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (mounted) {
          setIsLoading(false);
          setIsSceneReady(true);
          onStart?.();
        }
      } catch (error) {
        console.error('Failed to load AR scripts:', error);
        if (mounted) {
          onError?.(error);
          navigate('/');
        }
      }
    };

    void loadScripts();

    return () => {
      mounted = false;
      const scripts = document.querySelectorAll(
        'script[src*="aframe"], script[src*="ar.js"]'
      );
      scripts.forEach(script => script.remove());
      onEnd?.();
    };
  }, [onStart, onEnd, onError, navigate]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

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
          arjs="sourceType: webcam; debugUIEnabled: false; trackingMethod: best; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
          renderer="logarithmicDepthBuffer: true; antialias: true; alpha: true"
          vr-mode-ui="enabled: false"
          loading-screen="enabled: false"
        >
          <a-assets>
            <a-asset-item
              id="shoe-model"
              src="/susanna_heel.glb"
            ></a-asset-item>
          </a-assets>

          <a-marker preset="hiro">
            <a-entity
              gltf-model="#shoe-model"
              position="0 0 0"
              scale="0.5 0.5 0.5"
              rotation="-90 0 0"
            >
              <a-light type="ambient" color="#ffffff" intensity="1"></a-light>
              <a-light
                type="directional"
                color="#ffffff"
                intensity="0.6"
                position="1 1 1"
              ></a-light>
            </a-entity>
          </a-marker>

          <a-entity camera></a-entity>
        </a-scene>
      )}

      <button className={styles.backButton} onClick={handleBack}>
        ← Back to Map
      </button>

      <div className={styles.instructions}>
        Point your camera at a Hiro marker to view the 3D model
      </div>
    </div>
  );
};

export default ARViewer;
