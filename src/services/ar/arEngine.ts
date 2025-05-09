import * as THREE from 'three';
import { ProcessedModel } from '../model/ModelTransformer';
import { LocationService, Location } from './locationService';
import { initializeAFrame } from './aframe-init';

export interface ARSceneOptions {
  container: HTMLElement;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export interface PlacementOptions {
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: THREE.Vector3;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export class AREngine {
  private static instance: AREngine | null = null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private models: Map<string, THREE.Group> = new Map();
  private container: HTMLElement | null = null;
  private locationService: LocationService = LocationService.getInstance();
  private userLocation: Location | null = null;
  private drawingPlane: THREE.Mesh | null = null;
  private isDrawingEnabled = false;

  private constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    // Add basic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 0);
    this.scene.add(ambientLight);
    this.scene.add(directionalLight);
  }

  public static getInstance(): AREngine {
    if (!AREngine.instance) {
      AREngine.instance = new AREngine();
    }
    return AREngine.instance;
  }

  public static async initialize(options: ARSceneOptions): Promise<AREngine> {
    const instance = AREngine.getInstance();
    await instance.initialize(options);
    return instance;
  }

  public static cleanup(): void {
    if (AREngine.instance) {
      AREngine.instance.dispose();
      AREngine.instance = null;
    }
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public static getCamera(): THREE.PerspectiveCamera {
    const instance = AREngine.getInstance();
    return instance.getCamera();
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  async initialize(options: ARSceneOptions): Promise<void> {
    try {
      this.container = options.container;

      // Initialize A-Frame
      await initializeAFrame();

      // Initialize user location tracking first
      await this.initializeLocationTracking();

      if (!this.userLocation) {
        throw new Error('Could not get user location');
      }

      // Create A-Frame scene
      const aframeScene = document.createElement('a-scene');
      aframeScene.setAttribute('embedded', '');
      aframeScene.setAttribute('vr-mode-ui', 'enabled: false');
      aframeScene.setAttribute(
        'arjs',
        'sourceType: webcam; ' +
          'debugUIEnabled: false; ' +
          'trackingMethod: best; ' +
          'detectionMode: mono; ' +
          'maxDetectionRate: 30;'
      );

      // Add camera entity
      const camera = document.createElement('a-entity');
      camera.setAttribute('camera', '');
      camera.setAttribute('look-controls', 'enabled: true');
      camera.setAttribute('position', '0 1.6 0');
      camera.setAttribute('wasd-controls', 'enabled: false');

      // Add the Susanna model directly in front of the camera
      const modelEntity = document.createElement('a-entity');
      modelEntity.setAttribute('gltf-model', '/models/Susanna_heel.glb');
      modelEntity.setAttribute('position', '0 0 -3'); // 3 meters in front
      modelEntity.setAttribute('scale', '2 2 2'); // Life-size scale
      modelEntity.setAttribute('rotation', '0 0 0');

      // Add ambient light for better visibility
      const light = document.createElement('a-entity');
      light.setAttribute('light', {
        type: 'ambient',
        color: '#ffffff',
        intensity: 1.5,
      });

      aframeScene.appendChild(camera);
      aframeScene.appendChild(modelEntity);
      aframeScene.appendChild(light);

      // Add the scene to container
      this.container.appendChild(aframeScene);

      // Set up renderer
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight);

      // Handle window resize
      window.addEventListener('resize', this.onWindowResize.bind(this));

      // Wait for scene to load
      await new Promise<void>(resolve => {
        aframeScene.addEventListener('loaded', () => {
          console.log('A-Frame scene loaded');
          resolve();
        });
      });

      // Start AR experience
      options.onStart?.();
    } catch (error) {
      console.error('Failed to initialize AR:', error);
      options.onError?.(
        new Error(
          `AR initialization failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      );
      throw error;
    }
  }

  private async initializeLocationTracking(): Promise<void> {
    try {
      // Request permissions first
      const locationService = LocationService.getInstance();
      const permissionsGranted = await locationService.requestPermissions();

      if (!permissionsGranted) {
        throw new Error('Location permissions not granted');
      }

      // Start location tracking
      locationService.startTracking();

      // Wait for first location update
      const location = await new Promise<Location>((resolve, reject) => {
        const timeout = setTimeout(() => {
          cleanup();
          reject(new Error('Location timeout after 10 seconds'));
        }, 10000);

        const cleanup = locationService.onLocationUpdate((loc: Location) => {
          clearTimeout(timeout);
          cleanup();
          resolve(loc);
        });
      });

      this.userLocation = location;
      console.log('Location initialized:', location);
    } catch (error) {
      console.error('Failed to get user location:', error);
      throw error;
    }
  }

  private handleDrawPoint(point: THREE.Vector3): void {
    // Create a small sphere to represent the drawing point
    const geometry = new THREE.SphereGeometry(0.02);
    const material = new THREE.MeshStandardMaterial({ color: 0xff69b4 }); // Hot pink
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(point);
    this.scene.add(sphere);
  }

  public setDrawingEnabled(enabled: boolean): void {
    this.isDrawingEnabled = enabled;
    if (this.drawingPlane) {
      this.drawingPlane.visible = enabled;
    }
  }

  public dispose(): void {
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize.bind(this));

    // Dispose of Three.js resources
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        }
      }
    });

    // Clear models
    this.models.clear();

    // Remove from DOM
    if (this.container) {
      const aframeScene = this.container.querySelector('a-scene');
      if (aframeScene) {
        this.container.removeChild(aframeScene);
      }
    }

    // Reset properties
    this.container = null;
    this.userLocation = null;
    this.drawingPlane = null;
    this.isDrawingEnabled = false;
  }

  private onWindowResize(): void {
    if (this.container) {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  public async placeModel(
    model: ProcessedModel,
    options: PlacementOptions = {}
  ): Promise<void> {
    if (!this.userLocation) {
      throw new Error('User location not available');
    }

    const modelEntity = document.createElement('a-entity');

    // If coordinates are provided, use them for location-based placement
    if (options.coordinates) {
      modelEntity.setAttribute(
        'gps-projected-entity-place',
        `latitude: ${options.coordinates.latitude}; ` +
          `longitude: ${options.coordinates.longitude};`
      );
    } else {
      // Default to current user location if no coordinates provided
      modelEntity.setAttribute(
        'gps-projected-entity-place',
        `latitude: ${this.userLocation.latitude}; ` +
          `longitude: ${this.userLocation.longitude};`
      );
    }

    // Set initial scale and position
    modelEntity.setAttribute('scale', '1 1 1');
    modelEntity.setAttribute('position', '0 0 0');
    modelEntity.setAttribute('look-at', '[gps-projected-camera]');

    // Convert Three.js model to A-Frame entity
    const modelScene = model.scene.clone();
    if (options.position) modelScene.position.copy(options.position);
    if (options.rotation) modelScene.rotation.copy(options.rotation);
    if (options.scale) modelScene.scale.copy(options.scale);

    // Add model to A-Frame entity
    const modelWrapper = document.createElement('a-entity');
    modelWrapper.object3D = modelScene;
    modelEntity.appendChild(modelWrapper);

    // Track model for management
    this.models.set(model.metadata.id, modelScene);

    // Add to A-Frame scene
    const aframeScene = this.container?.querySelector('a-scene');
    if (aframeScene) {
      aframeScene.appendChild(modelEntity);
    }
  }

  public removeModel(modelId: string): void {
    const model = this.models.get(modelId);
    if (model) {
      // Find the parent A-Frame entity by traversing up from the model
      let currentElement = model.parent;
      while (currentElement && !(currentElement instanceof HTMLElement)) {
        currentElement = currentElement.parent;
      }

      // Remove from DOM if we found the A-Frame entity
      if (
        currentElement instanceof HTMLElement &&
        currentElement.parentElement
      ) {
        currentElement.parentElement.removeChild(currentElement);
      }

      this.models.delete(modelId);
    }
  }

  public updateModelTransform(
    modelId: string,
    position?: THREE.Vector3,
    rotation?: THREE.Euler,
    scale?: THREE.Vector3
  ): void {
    const model = this.models.get(modelId);
    if (model) {
      if (position) model.position.copy(position);
      if (rotation) model.rotation.copy(rotation);
      if (scale) model.scale.copy(scale);
    }
  }
}

export default AREngine;
