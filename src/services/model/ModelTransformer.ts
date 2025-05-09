import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { ModelMetadata } from '../firebase/metadata';

export interface ModelTransform {
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: THREE.Vector3;
}

export interface ProcessedModel {
  scene: THREE.Group;
  metadata: ModelMetadata;
  boundingBox: THREE.Box3;
  transform: ModelTransform;
}

export class ModelTransformer {
  private static loader: GLTFLoader;
  private static dracoLoader: DRACOLoader;

  static initialize() {
    // Initialize DRACO loader for compressed models
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/draco/');

    // Initialize GLTF loader with DRACO support
    this.loader = new GLTFLoader();
    this.loader.setDRACOLoader(this.dracoLoader);
  }

  static async loadModel(url: string): Promise<THREE.Group> {
    if (!this.loader) {
      this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.loader.load(url, gltf => resolve(gltf.scene), undefined, reject);
    });
  }

  static async processModel(
    model: THREE.Group,
    metadata: ModelMetadata
  ): Promise<ProcessedModel> {
    // Calculate bounding box
    const boundingBox = new THREE.Box3().setFromObject(model);

    // Center the model
    const center = boundingBox.getCenter(new THREE.Vector3());
    model.position.sub(center);

    // Calculate appropriate scale
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    const scale = 1 / maxDimension;
    model.scale.multiplyScalar(scale);

    // Update bounding box after transformations
    boundingBox.setFromObject(model);

    return {
      scene: model,
      metadata,
      boundingBox,
      transform: {
        position: model.position.clone(),
        rotation: model.rotation.clone(),
        scale: model.scale.clone(),
      },
    };
  }

  static optimizeGeometry(model: THREE.Group): void {
    model.traverse(child => {
      if (child instanceof THREE.Mesh) {
        // Merge small geometries
        if (child.geometry instanceof THREE.BufferGeometry) {
          child.geometry.computeVertexNormals();
          child.geometry.computeBoundingSphere();
          child.geometry.computeBoundingBox();
        }

        // Optimize materials
        if (child.material instanceof THREE.Material) {
          child.material.needsUpdate = true;
          if (
            child.material instanceof THREE.MeshStandardMaterial &&
            child.material.map
          ) {
            child.material.map.needsUpdate = true;
          }
        }
      }
    });
  }

  static applyTransform(model: THREE.Group, transform: ModelTransform): void {
    if (transform.position) {
      model.position.copy(transform.position);
    }
    if (transform.rotation) {
      model.rotation.copy(transform.rotation);
    }
    if (transform.scale) {
      model.scale.copy(transform.scale);
    }
  }

  static generateThumbnail(
    model: THREE.Group,
    width = 256,
    height = 256
  ): Promise<string> {
    // Create a scene for thumbnail rendering
    const scene = new THREE.Scene();
    scene.add(model);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 1);
    scene.add(ambientLight, directionalLight);

    // Set up camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const boundingBox = new THREE.Box3().setFromObject(model);
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.set(
      center.x + maxDim * 2,
      center.y + maxDim,
      center.z + maxDim * 2
    );
    camera.lookAt(center);

    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0xffffff);

    // Render the thumbnail
    renderer.render(scene, camera);

    return new Promise(resolve => {
      const dataUrl = renderer.domElement.toDataURL('image/png');
      resolve(dataUrl);
    });
  }

  static dispose(): void {
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
    }
  }
}
