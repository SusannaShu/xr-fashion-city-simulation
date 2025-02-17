let isInitialized = false;

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

  // Dynamically import A-Frame and AR.js
  await import('aframe');
  await import('@ar-js-org/ar.js/aframe/build/aframe-ar');

  isInitialized = true;
};
