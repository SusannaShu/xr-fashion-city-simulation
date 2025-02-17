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
          aframeScript.src = 'https://aframe.io/releases/1.4.0/aframe.min.js';
          aframeScript.onload = () => resolve();
          aframeScript.onerror = reject;
          document.head.appendChild(aframeScript);
        });

        // Then load AR.js
        await new Promise<void>((resolve, reject) => {
          const arScript = document.createElement('script') as any;
          arScript.src =
            'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js';
          arScript.onload = () => resolve();
          arScript.onerror = reject;
          document.head.appendChild(arScript);
        });

        // Call onStart when scripts are loaded
        onStart?.();
      } catch (error) {
        console.error('Failed to load AR scripts:', error);
        onError?.(error);
      }
    };

    void loadScripts();

    return () => {
      // Cleanup scripts when component unmounts
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

  return (
    <div className={styles.container}>
      <a-scene
        embedded
        arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
        renderer="logarithmicDepthBuffer: true;"
        vr-mode-ui="enabled: false"
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
