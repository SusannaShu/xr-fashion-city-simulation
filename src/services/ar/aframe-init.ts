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
    script.src = 'https://aframe.io/releases/1.4.2/aframe.min.js';
    script.setAttribute('data-aframe-initialized', 'true');
    document.head.appendChild(script);

    // Wait for A-Frame to be loaded
    await new Promise<void>((resolve, reject) => {
      const maxAttempts = 50;
      let attempts = 0;

      const checkInit = () => {
        if (window.AFRAME && window.AFRAME.components) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(
            new Error('Failed to initialize A-Frame: timeout after 5 seconds')
          );
        } else {
          attempts++;
          setTimeout(checkInit, 100);
        }
      };

      checkInit();
    });

    // Register custom components
    if (window.AFRAME) {
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
