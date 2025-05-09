let isInitialized = false;

declare global {
  interface Window {
    AFRAME: any; // Keep as any to avoid type conflicts
    THREEx: any;
  }
}

interface AFrameEntity extends HTMLElement {
  emit: (event: string, detail: any) => void;
  setAttribute: (attr: string, props: any) => void;
  object3D: THREE.Object3D;
}

interface AFrameComponent {
  el: AFrameEntity;
  init?: () => void;
  update?: (oldData?: any) => void;
  remove?: () => void;
  tick?: (time?: number, timeDelta?: number) => void;
}

interface AFrameIntersectionEvent {
  detail: {
    intersection: {
      point: { x: number; y: number; z: number };
      face: {
        normal: { x: number; y: number; z: number };
      };
    };
  };
  target: AFrameEntity;
}

export const initializeAFrame = async (): Promise<void> => {
  if (isInitialized) {
    return;
  }

  // Check if scripts are already loaded
  const existingAFrame = document.querySelector(
    'script[data-aframe-initialized]'
  );
  const existingARjs = document.querySelector('script[data-arjs-initialized]');
  const existingLocation = document.querySelector(
    'script[data-location-initialized]'
  );

  if (existingAFrame && existingARjs && existingLocation) {
    isInitialized = true;
    return;
  }

  try {
    // Only load scripts that aren't already present
    if (!existingAFrame) {
      const script = document.createElement('script');
      const htmlScript = script as unknown as HTMLScriptElement;
      htmlScript.src = 'https://aframe.io/releases/1.4.2/aframe.min.js';
      htmlScript.setAttribute('data-aframe-initialized', 'true');
      htmlScript.crossOrigin = 'anonymous';
      document.head.appendChild(htmlScript);
      await new Promise<void>((resolve, reject) => {
        htmlScript.onload = () => resolve();
        htmlScript.onerror = () =>
          reject(new Error('Failed to load A-Frame script'));
      });
    }

    if (!existingARjs) {
      const arjsScript = document.createElement('script');
      const arjsHtmlScript = arjsScript as unknown as HTMLScriptElement;
      arjsHtmlScript.src =
        'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar-nft.js';
      arjsHtmlScript.setAttribute('data-arjs-initialized', 'true');
      arjsHtmlScript.crossOrigin = 'anonymous';
      document.head.appendChild(arjsHtmlScript);
      await new Promise<void>((resolve, reject) => {
        arjsHtmlScript.onload = () => resolve();
        arjsHtmlScript.onerror = () =>
          reject(new Error('Failed to load AR.js script'));
      });
    }

    if (!existingLocation) {
      const locationScript = document.createElement('script');
      const locationHtmlScript = locationScript as unknown as HTMLScriptElement;
      locationHtmlScript.src =
        'https://unpkg.com/aframe-look-at-component@0.8.0/dist/aframe-look-at-component.min.js';
      locationHtmlScript.setAttribute('data-location-initialized', 'true');
      locationHtmlScript.crossOrigin = 'anonymous';
      document.head.appendChild(locationHtmlScript);
      await new Promise<void>((resolve, reject) => {
        locationHtmlScript.onload = () => resolve();
        locationHtmlScript.onerror = () =>
          reject(new Error('Failed to load location component script'));
      });
    }

    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize A-Frame:', error);
    throw error;
  }
};
