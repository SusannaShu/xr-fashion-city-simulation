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

  // Remove any existing A-Frame script tags
  const existingScripts = document.querySelectorAll(
    'script[data-aframe-initialized]'
  );
  existingScripts.forEach(script => script.remove());

  // Remove any existing custom elements
  const customElements = window.customElements;
  const definedElements = [
    'a-node',
    'a-scene',
    'a-entity',
    'a-camera',
    'a-box',
    'a-sphere',
    'a-cylinder',
    'a-plane',
    'a-sky',
    'a-assets',
    'a-asset-item',
    'a-marker',
    'a-marker-camera',
  ];

  // Try to clean up existing registrations
  definedElements.forEach(elementName => {
    try {
      // Only attempt to delete if it exists
      if (customElements.get(elementName)) {
        customElements.delete?.(elementName);
      }
    } catch (e) {
      console.warn(`Could not clean up ${elementName}`, e);
    }
  });

  try {
    // Load A-Frame script dynamically
    const script = document.createElement('script');
    const htmlScript = script as unknown as HTMLScriptElement;
    htmlScript.src = 'https://aframe.io/releases/1.4.2/aframe.min.js';
    htmlScript.setAttribute('data-aframe-initialized', 'true');
    htmlScript.crossOrigin = 'anonymous';

    // Load AR.js with location-based support
    const arjsScript = document.createElement('script');
    const arjsHtmlScript = arjsScript as unknown as HTMLScriptElement;
    arjsHtmlScript.src =
      'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar-nft.js';
    arjsHtmlScript.setAttribute('data-arjs-initialized', 'true');
    arjsHtmlScript.crossOrigin = 'anonymous';

    // Load location-based components
    const locationScript = document.createElement('script');
    const locationHtmlScript = locationScript as unknown as HTMLScriptElement;
    locationHtmlScript.src =
      'https://unpkg.com/aframe-look-at-component@0.8.0/dist/aframe-look-at-component.min.js';
    locationHtmlScript.setAttribute('data-location-initialized', 'true');
    locationHtmlScript.crossOrigin = 'anonymous';

    document.head.appendChild(htmlScript);
    document.head.appendChild(arjsHtmlScript);
    document.head.appendChild(locationHtmlScript);

    // Wait for all scripts to load
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        htmlScript.onload = () => resolve();
        htmlScript.onerror = () =>
          reject(new Error('Failed to load A-Frame script'));
      }),
      new Promise<void>((resolve, reject) => {
        arjsHtmlScript.onload = () => resolve();
        arjsHtmlScript.onerror = () =>
          reject(new Error('Failed to load AR.js script'));
      }),
      new Promise<void>((resolve, reject) => {
        locationHtmlScript.onload = () => resolve();
        locationHtmlScript.onerror = () =>
          reject(new Error('Failed to load location component script'));
      }),
    ]);

    // Register custom components
    if (window.AFRAME) {
      // Model component for handling 3D models
      window.AFRAME.registerComponent('gltf-model-plus', {
        schema: {
          src: { type: 'string' },
          position: { type: 'vec3' },
          scale: { type: 'vec3', default: { x: 1, y: 1, z: 1 } },
        },
        init: function () {
          const data = this.data;
          const el = this.el;

          // Load the model
          el.setAttribute('gltf-model', data.src);

          // Set position and scale
          el.setAttribute('position', data.position);
          el.setAttribute('scale', data.scale);
        },
      });

      // Drawing component for handling drawing interactions
      window.AFRAME.registerComponent('drawing-plane', {
        init: function (this: AFrameComponent) {
          const el = this.el;
          el.addEventListener('click', (event: Event) => {
            const aframeEvent = event as unknown as AFrameIntersectionEvent;
            if (aframeEvent.detail?.intersection) {
              el.emit('draw-point', {
                point: aframeEvent.detail.intersection.point,
                normal: aframeEvent.detail.intersection.face.normal,
              });
            }
          });
        },
      });

      // Hot pink material component
      window.AFRAME.registerComponent('hot-pink', {
        init: function (this: AFrameComponent) {
          this.el.setAttribute('material', {
            color: '#FF69B4',
            shader: 'standard',
            metalness: 0.2,
            roughness: 0.8,
          });
        },
      });
    }

    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize A-Frame:', error);
    throw new Error(
      `A-Frame initialization failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
