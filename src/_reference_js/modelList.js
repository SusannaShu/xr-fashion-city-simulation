import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import {
  modelRef,
  customLayerRef,
  setModelColor,
  deselectModel,
} from './modelInteraction.js';

let selectedModel = null;
let transformControls = null;

// Function to handle model selection
export function selectModel(model) {
  console.log('selectModel called with:', model);
  console.log('customLayerRef:', customLayerRef);

  // If clicking the same model again, deselect it
  if (selectedModel === model) {
    // Clear selection
    selectedModel = null;
    const previousCard = document.querySelector('.selected');
    if (previousCard) previousCard.classList.remove('selected');
    deselectModel();
    hideScalePanel();
    return;
  }

  // Clear previous selection
  if (selectedModel) {
    const previousCard = document.querySelector('.selected');
    if (previousCard) previousCard.classList.remove('selected');
    deselectModel();
    hideScalePanel();
  }

  // Update selection state
  selectedModel = model;

  if (selectedModel) {
    console.log('Setting up new selection');

    // Find and select corresponding card
    const modelCard = document.querySelector(
      `.model-item[data-model="${selectedModel.userData.modelId}"]`
    );
    if (modelCard) {
      console.log('Found model card, adding selected class');
      modelCard.classList.add('selected');
    }

    selectedModel.userData.initialScale = selectedModel.scale.x;

    // Update model color to pink
    setModelColor(true);

    // Show controls with animation
    showScalePanel();

    // Reset scale slider to middle if it exists
    const scaleSlider = document.getElementById('scale-slider');
    const scaleValue = document.getElementById('scale-value');
    if (scaleSlider && scaleValue) {
      scaleSlider.value = 50;
      scaleValue.textContent = '1.0x';
      // Update slider gradient
      const percentage =
        ((50 - scaleSlider.min) / (scaleSlider.max - scaleSlider.min)) * 100;
      scaleSlider.style.background = `linear-gradient(to right, #FF69B4 ${percentage}%, #eee ${percentage}%)`;
    }

    // Show transform controls if they exist
    if (customLayerRef && customLayerRef.transformControls) {
      console.log('Setting up transform controls');
      customLayerRef.transformControls.attach(selectedModel);
      customLayerRef.transformControls.visible = true;
      customLayerRef.transformControls.showX = true;
      customLayerRef.transformControls.showY = true;
      customLayerRef.transformControls.showZ = true;
      customLayerRef.transformControls.size = 0.5;
    } else {
      console.log('No transform controls to show:', customLayerRef);
    }
  }
}

// Function to initialize scale controls
function initializeScaleControls() {
  const scaleSlider = document.getElementById('scale-slider');
  const scaleValue = document.getElementById('scale-value');

  if (scaleSlider && scaleValue) {
    // Update slider gradient on input
    function updateSliderGradient(value) {
      const percentage =
        ((value - scaleSlider.min) / (scaleSlider.max - scaleSlider.min)) * 100;
      scaleSlider.style.background = `linear-gradient(to right, #FF69B4 ${percentage}%, #eee ${percentage}%)`;
    }

    scaleSlider.addEventListener('input', e => {
      const value = e.target.value;
      const scale = value / 50;
      scaleValue.textContent = `${scale.toFixed(1)}x`;
      updateSliderGradient(value);
      handleScaleChange(value);
    });

    // Initialize slider gradient
    updateSliderGradient(scaleSlider.value);
  }
}

// Function to handle scale change
function handleScaleChange(value) {
  if (selectedModel) {
    const scale = value / 50;
    selectedModel.scale.setScalar(scale * selectedModel.userData.initialScale);
    if (customLayerRef) {
      customLayerRef.map.triggerRepaint();
    }
  }
}

// Function to show scale panel with animation
function showScalePanel() {
  const scalePanel = document.getElementById('scale-panel');
  if (scalePanel) {
    scalePanel.style.display = 'block';
    // Force a reflow to ensure the animation plays
    scalePanel.offsetHeight;
    scalePanel.classList.add('visible');
  }
}

// Function to hide scale panel with animation
function hideScalePanel() {
  const scalePanel = document.getElementById('scale-panel');
  if (scalePanel) {
    scalePanel.classList.remove('visible');
    setTimeout(() => {
      scalePanel.style.display = 'none';
    }, 300); // Match the CSS transition duration
  }
}

// Function to generate thumbnail from GLB model
async function generateModelThumbnail(modelPath) {
  return new Promise(resolve => {
    // Create a scene for thumbnail rendering
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // Create camera
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(2, 2, 2);
    camera.lookAt(0, 0, 0);

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(200, 200);
    renderer.outputEncoding = THREE.sRGBEncoding;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(1, 2, 3);
    scene.add(ambientLight);
    scene.add(directionalLight);

    // Load the model
    const loader = new GLTFLoader();
    loader.load(modelPath, gltf => {
      // Center and scale the model
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1.5 / maxDim;

      gltf.scene.position.sub(center);
      gltf.scene.scale.multiplyScalar(scale);
      scene.add(gltf.scene);
      gltf.scene.rotation.y = Math.PI / 4;

      renderer.render(scene, camera);
      const thumbnailUrl = renderer.domElement.toDataURL('image/png');
      resolve(thumbnailUrl);

      // Clean up
      gltf.scene.traverse(child => {
        if (child.isMesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
      renderer.dispose();
    });
  });
}

// Initialize model list and controls
export function initializeModelList() {
  const modelItems = document.querySelectorAll('.model-item');

  // Create transform controls
  const scene = selectedModel?.parent || document.querySelector('three-scene');
  if (scene?.camera) {
    transformControls = new TransformControls(
      scene.camera,
      scene.renderer.domElement
    );
    transformControls.addEventListener('dragging-changed', event => {
      if (window.map) {
        window.map.dragPan.enable(!event.value);
        window.map.dragRotate.enable(!event.value);
      }
    });
    scene.add(transformControls);
    transformControls.setMode('translate');

    // Add click handler for model selection in scene
    scene.addEventListener('click', event => {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );

      raycaster.setFromCamera(mouse, scene.camera);
      const intersects = raycaster.intersectObject(scene.children[0], true);

      if (intersects.length > 0) {
        const clickedModel = intersects[0].object.parent;
        selectModel(clickedModel);
      } else {
        selectModel(null);
      }
    });
  }

  // Create model list container
  const listContainer = document.createElement('div');
  listContainer.id = 'model-list-container';
  listContainer.innerHTML = `
        <div class="model-list"></div>
    `;

  // Move existing model items to new container
  const modelList = listContainer.querySelector('.model-list');
  modelItems.forEach(item => {
    modelList.appendChild(item);
  });

  document.body.appendChild(listContainer);

  modelItems.forEach(async item => {
    // Generate thumbnail for each model
    const modelPath = `./models/${item.dataset.model}.glb`;
    const thumbnailUrl = await generateModelThumbnail(modelPath);

    // Update the thumbnail image
    const thumbnailImg = item.querySelector('.model-thumbnail');
    thumbnailImg.src = thumbnailUrl;

    item.addEventListener('click', () => {
      if (modelRef) {
        modelRef.userData.modelId = item.dataset.model;
        selectModel(modelRef);
      }
    });
  });

  // Initialize scale controls
  initializeScaleControls();
}

// Make selectModel globally available
window.selectModel = selectModel;

// Update styles
const style = document.createElement('style');
style.textContent = `
    #model-ui-container {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        pointer-events: none;
    }

    #scale-panel {
        background-color: rgba(255, 255, 255, 0.95);
        margin: 0 16px 12px;
        padding: 12px 16px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        display: none;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(10px);
        z-index: 1002;
        pointer-events: auto;
        margin-bottom: 12px;
    }

    #model-list-container {
        background-color: rgba(255, 255, 255, 0.95);
        padding: 16px 0;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        z-index: 1001;
        pointer-events: auto;
        margin-top: auto;
    }

    .scale-control {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .scale-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 2px;
    }

    .label-text {
        font-size: 14px;
        font-weight: 600;
        color: #333;
    }

    #scale-value {
        font-size: 14px;
        font-weight: 500;
        color: #ff69b4;
        min-width: 45px;
    }

    .scale-control input[type="range"] {
        width: 100%;
        height: 4px;
        -webkit-appearance: none;
        background: #eee;
        border-radius: 2px;
        outline: none;
        margin: 8px 0;
    }

    .scale-control input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        background: #ff69b4;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 6px rgba(255, 105, 180, 0.3);
        margin-top: -8px;
    }

    .scale-control input[type="range"]::-webkit-slider-thumb:hover {
        background: #ff1493;
        transform: scale(1.1);
    }

    .model-list {
        display: flex;
        gap: 12px;
        overflow-x: auto;
        padding: 0 16px;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    .model-list::-webkit-scrollbar {
        display: none;
    }

    .model-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 100px;
        padding: 8px;
        margin-top: 0;
        background-color: white;
        border: 2px solid #eee;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .model-thumbnail {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 8px;
        margin-bottom: 8px;
        background-color: #f5f5f5;
    }

    .model-name {
        font-size: 13px;
        font-weight: 500;
        color: #333;
        text-align: center;
    }

    .model-item:hover {
        border-color: #ff69b4;
        background-color: #fff5f8;
        transform: translateY(-2px);
        margin-top: 2px;
    }

    .model-item.selected {
        background-color: #fff0f5;
        border-color: #ff69b4;
        transform: translateY(-8px);
        margin-top: 8px;
        box-shadow: 0 4px 12px rgba(255, 105, 180, 0.2);
    }

    @media (max-width: 768px) {
        #scale-panel {
            margin: 0 12px 12px;
        }
        
        .model-list {
            gap: 10px;
            padding: 0 12px;
        }
        
        .model-item {
            min-width: 90px;
        }
        
        .model-thumbnail {
            width: 70px;
            height: 70px;
        }
    }
`;
document.head.appendChild(style);
