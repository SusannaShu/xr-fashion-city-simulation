let isInitialized = false;

declare global {
  interface Window {
    AFRAME: any;
    THREEx: any;
  }
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

  // Wait for A-Frame and AR.js to be loaded from CDN
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

  isInitialized = true;
};
