import React, { useEffect } from 'react';
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

  useEffect(() => {
    // Load A-Frame script
    const loadScripts = async () => {
      try {
        // Load A-Frame first
        await new Promise<void>((resolve, reject) => {
          const aframeScript = document.createElement('script') as any;
          // Using unpkg CDN which has better CORS support
          aframeScript.src =
            'https://unpkg.com/aframe@1.4.0/dist/aframe-master.min.js';
          aframeScript.crossOrigin = 'anonymous';
          aframeScript.onload = () => resolve();
          aframeScript.onerror = e => {
            console.error('Failed to load A-Frame:', e);
            reject(new Error('Failed to load A-Frame'));
          };
          document.head.appendChild(aframeScript);
        });

        // Then load AR.js
        await new Promise<void>((resolve, reject) => {
          const arScript = document.createElement('script') as any;
          // Using jsDelivr CDN which has better CORS support
          arScript.src =
            'https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@master/aframe/build/aframe-ar.js';
          arScript.crossOrigin = 'anonymous';
          arScript.onload = () => resolve();
          arScript.onerror = e => {
            console.error('Failed to load AR.js:', e);
            reject(new Error('Failed to load AR.js'));
          };
          document.head.appendChild(arScript);
        });

        // Call onStart when scripts are loaded
        onStart?.();
      } catch (error) {
        console.error('Failed to load AR scripts:', error);
        onError?.(error);
        // Navigate back to map view on error
        navigate('/');
      }
    };

    void loadScripts();

    return () => {
      // Cleanup scripts when component unmounts
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

  return (
    <div className={styles.container}>
      <a-scene
        embedded
        arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
        renderer="logarithmicDepthBuffer: true;"
        vr-mode-ui="enabled: false"
        loading-screen="enabled: false"
      >
        {/* Camera */}
        <a-entity camera></a-entity>

        {/* Susanna Shoes Model */}
        <a-entity
          gltf-model="/susanna_heel.glb"
          position="0 0 -1"
          scale="0.5 0.5 0.5"
          rotation="0 0 0"
        >
          {/* Add ambient light for better visibility */}
          <a-light type="ambient" color="#ffffff" intensity="1"></a-light>
        </a-entity>
      </a-scene>

      {/* Back button */}
      <button className={styles.backButton} onClick={handleBack}>
        ← Back to Map
      </button>
    </div>
  );
};

export default ARViewer;
