import React, { useEffect, useState } from 'react';
import styles from './ARViewer.module.css';

interface ScriptConfig {
  src: string;
  id: string;
}

// Load A-Frame and AR.js only once when the component is mounted
const loadARDependencies = async () => {
  if (!(window as any).AFRAME) {
    // Load scripts in sequence
    const scripts: ScriptConfig[] = [
      {
        src: 'https://raw.githack.com/AR-js-org/AR.js/master/three.js/build/ar-threex.js',
        id: 'ar-threex-script',
      },
      {
        src: 'https://aframe.io/releases/1.4.2/aframe.min.js',
        id: 'aframe-script',
      },
      {
        src: 'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js',
        id: 'ar-location-script',
      },
    ];

    for (const script of scripts) {
      await new Promise<void>((resolve, reject) => {
        console.log(`[AR Debug] Loading ${script.id}...`);
        const scriptElement = document.createElement('script');
        const htmlScriptElement = scriptElement as unknown as HTMLScriptElement;
        htmlScriptElement.src = script.src;
        htmlScriptElement.id = script.id;
        htmlScriptElement.async = false;
        htmlScriptElement.onload = () => {
          console.log(`[AR Debug] Loaded ${script.id}`);
          resolve();
        };
        htmlScriptElement.onerror = e => {
          console.error(`[AR Debug] Failed to load ${script.id}:`, e);
          reject(new Error(`Failed to load ${script.src}`));
        };
        document.head.appendChild(htmlScriptElement);
      });

      // Add a small delay between script loads
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Wait for THREEx to be defined
    let attempts = 0;
    while (!(window as any).THREEx && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      console.log('[AR Debug] Waiting for THREEx...', attempts);
    }

    if (!(window as any).THREEx) {
      throw new Error('Failed to initialize THREEx');
    }

    console.log('[AR Debug] THREEx initialized successfully');

    // Wait for AR.js components to be registered
    attempts = 0;
    while (
      !(window as any).AFRAME?.components?.['gps-camera'] &&
      attempts < 50
    ) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      console.log('[AR Debug] Waiting for AR.js components...', attempts);
    }

    if (!(window as any).AFRAME?.components?.['gps-camera']) {
      throw new Error('Failed to initialize AR.js components');
    }

    console.log('[AR Debug] AR.js initialized successfully');
  }
};

const ARScene: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        await loadARDependencies();
        if (mounted) {
          setIsInitialized(true);
          console.log('[AR Debug] Scene ready');
        }
      } catch (err) {
        console.error('Failed to load AR dependencies:', err);
        if (mounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to initialize AR'
          );
        }
      }
    };

    void initialize();

    return () => {
      mounted = false;
      // Cleanup function
      ['aframe-script', 'ar-threex-script', 'ar-location-script'].forEach(
        id => {
          const script = document.getElementById(id);
          if (script) {
            script.remove();
          }
        }
      );

      // Reset globals
      (window as any).AFRAME = undefined;
      (window as any).THREEx = undefined;
    };
  }, []);

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  if (!isInitialized) {
    return <div className={styles.loading}>Initializing AR...</div>;
  }

  return (
    <div className={styles.arScene}>
      <a-scene
        embedded
        loading-screen="enabled: false"
        arjs="sourceType: webcam; debugUIEnabled: false; trackingMethod: best;"
        renderer="logarithmicDepthBuffer: true; precision: medium;"
        vr-mode-ui="enabled: false"
      >
        <a-camera gps-camera rotation-reader></a-camera>
      </a-scene>
    </div>
  );
};

export default ARScene;
