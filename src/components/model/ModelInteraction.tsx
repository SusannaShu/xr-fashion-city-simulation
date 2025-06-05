import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { Model } from '../../types/models';

interface ModelInteractionProps {
  model: Model | null;
  onModelUpdate: (updates: Partial<Model>) => void;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
}

export const ModelInteraction: React.FC<ModelInteractionProps> = ({
  model,
  onModelUpdate,
  camera,
  renderer,
}) => {
  const transformControlsRef = useRef<TransformControls | null>(null);
  const [scale, setScale] = useState<number>(1.0);

  useEffect(() => {
    if (!model || !camera || !renderer) return;

    // Initialize transform controls
    const controls = new TransformControls(camera, renderer.domElement);
    transformControlsRef.current = controls;

    controls.addEventListener('dragging-changed', event => {
      if (window.map) {
        // When dragging, disable map interactions
        if (event.value) {
          window.map.dragPan.disable();
          window.map.dragRotate.disable();
        } else {
          window.map.dragPan.enable();
          window.map.dragRotate.enable();
        }
      }
    });

    controls.addEventListener('objectChange', () => {
      if (model) {
        onModelUpdate({
          position: {
            x: model.position?.x || 0,
            y: model.position?.y || 0,
            z: model.position?.z || 0,
          },
          rotation: {
            x: model.rotation?.x || 0,
            y: model.rotation?.y || 0,
            z: model.rotation?.z || 0,
          },
        });
      }
    });

    controls.setMode('translate');
    controls.setSize(0.5);

    return () => {
      controls.dispose();
    };
  }, [model, camera, renderer, onModelUpdate]);

  const handleScaleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(event.target.value) / 50;
    setScale(newScale);

    if (model) {
      onModelUpdate({
        scale: {
          x: newScale,
          y: newScale,
          z: newScale,
        },
      });
    }
  };

  if (!model) return null;

  return (
    <div className="model-interaction-panel">
      <div className="scale-controls">
        <label htmlFor="scale-slider">Scale</label>
        <input
          id="scale-slider"
          type="range"
          min="1"
          max="100"
          value={scale * 50}
          onChange={handleScaleChange}
          className="scale-slider"
        />
        <span className="scale-value">{scale.toFixed(1)}x</span>
      </div>
      <div className="transform-controls">
        <button
          onClick={() => transformControlsRef.current?.setMode('translate')}
          className="transform-button"
        >
          Move
        </button>
        <button
          onClick={() => transformControlsRef.current?.setMode('rotate')}
          className="transform-button"
        >
          Rotate
        </button>
      </div>
    </div>
  );
};

export default ModelInteraction;
