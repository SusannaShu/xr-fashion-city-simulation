import React, { useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { Model, ModelInteractionState } from '../../types/models';

interface ModelListProps {
  onModelSelect: (model: Model | null) => void;
  selectedModel: Model | null;
  models: Model[];
}

export const ModelList: React.FC<ModelListProps> = ({
  onModelSelect,
  selectedModel,
  models,
}) => {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [interactionState, setInteractionState] =
    useState<ModelInteractionState>({
      selectedModel: null,
      isEditing: false,
      isDragging: false,
      isRotating: false,
      isScaling: false,
    });

  const generateModelThumbnail = useCallback(
    async (modelPath: string): Promise<string> => {
      return new Promise(resolve => {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(2, 2, 2);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(200, 200);
        renderer.outputEncoding = THREE.sRGBEncoding;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
        directionalLight.position.set(1, 2, 3);
        scene.add(ambientLight, directionalLight);

        const loader = new GLTFLoader();
        loader.load(modelPath, gltf => {
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 1.5 / maxDim;

          gltf.scene.position.sub(center);
          gltf.scene.scale.multiplyScalar(scale);
          gltf.scene.rotation.y = Math.PI / 4;
          scene.add(gltf.scene);

          renderer.render(scene, camera);
          const thumbnailUrl = renderer.domElement.toDataURL('image/png');
          resolve(thumbnailUrl);

          // Cleanup
          gltf.scene.traverse(child => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.geometry.dispose();
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => mat.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          });
          renderer.dispose();
        });
      });
    },
    []
  );

  useEffect(() => {
    const loadThumbnails = async () => {
      const newThumbnails: Record<string, string> = {};
      for (const model of models) {
        const thumbnail = await generateModelThumbnail(model.url);
        newThumbnails[model.id] = thumbnail;
      }
      setThumbnails(newThumbnails);
    };

    loadThumbnails();
  }, [models, generateModelThumbnail]);

  const handleModelClick = (model: Model) => {
    if (selectedModel?.id === model.id) {
      onModelSelect(null);
      setInteractionState(prev => ({
        ...prev,
        selectedModel: null,
        isEditing: false,
      }));
    } else {
      onModelSelect(model);
      setInteractionState(prev => ({
        ...prev,
        selectedModel: model,
        isEditing: true,
      }));
    }
  };

  return (
    <div className="model-list-container">
      <div className="model-list">
        {models.map(model => (
          <div
            key={model.id}
            className={`model-item ${
              selectedModel?.id === model.id ? 'selected' : ''
            }`}
            onClick={() => handleModelClick(model)}
          >
            {thumbnails[model.id] ? (
              <img
                src={thumbnails[model.id]}
                alt={model.name}
                className="model-thumbnail"
              />
            ) : (
              <div className="thumbnail-placeholder">Loading...</div>
            )}
            <div className="model-info">
              <h3>{model.name}</h3>
              {model.location && (
                <p className="model-location">
                  {`${model.location.latitude.toFixed(
                    6
                  )}, ${model.location.longitude.toFixed(6)}`}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelList;
