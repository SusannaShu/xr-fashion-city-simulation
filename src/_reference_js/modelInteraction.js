// Model interaction state and utilities
export const modelState = {
  position: [2.3378, 48.8644], // Initial position
  scale: 50, // Initial scale
  rotation: [Math.PI / 2, 0, 0], // Initial rotation
  altitude: 0, // Add explicit altitude tracking
};

// References to Three.js objects
export let modelRef = null;
export let customLayerRef = null;

// Set references
export function setModelRef(ref) {
  modelRef = ref;
  // Set initial material color
  if (modelRef) {
    setModelColor(false);
  }
}

export function setCustomLayerRef(ref) {
  customLayerRef = ref;
  console.log('Custom layer reference set:', customLayerRef);
}

// Function to set model color based on selection state
export function setModelColor(isSelected) {
  if (!modelRef) return;

  const color = isSelected ? 0xff69b4 : 0xcccccc; // Pink when selected, grey when not
  modelRef.traverse(child => {
    if (child.isMesh) {
      if (!child.originalMaterial) {
        // Store the original material on first run
        child.originalMaterial = child.material.clone();
      }
      child.material = new THREE.MeshPhongMaterial({
        color: color,
        shininess: 30,
        flatShading: false,
      });
    }
  });
}

// Function to deselect model
export function deselectModel() {
  if (modelRef) {
    setModelColor(false);
  }
}

// Scale handling
export function updateModelScale(newScale, map) {
  // Clamp the scale value between 5 and 50
  const clampedScale = Math.max(0.5, Math.min(50, newScale));
  modelState.scale = clampedScale;

  if (modelRef) {
    const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
      modelState.position,
      0
    );
    const scale = modelAsMercatorCoordinate.meterInMercatorCoordinateUnits();
    const adjustedScale = scale * clampedScale * 10;

    console.log('Scale factors:', {
      base: scale,
      userScale: clampedScale,
      multiplier: 10,
      final: adjustedScale,
    });

    modelRef.scale.set(adjustedScale, adjustedScale, adjustedScale);
    map.triggerRepaint();
  }
}
