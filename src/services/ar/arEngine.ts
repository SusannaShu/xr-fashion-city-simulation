import * as THREE from 'three';
import { ProcessedModel } from '../model/ModelTransformer';
import { LocationService, Location } from './locationService';
import { initARjs } from './arjsSetup';

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
    this.scene.add(ambientLight);
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

  public static getCamera(): THREE.PerspectiveCamera {
    const instance = AREngine.getInstance();
    return instance.camera;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  async initialize(options: ARSceneOptions): Promise<void> {
    try {
      this.container = options.container;

      // Initialize AR.js
      await initARjs();

      // Initialize user location tracking first
      await this.initializeLocationTracking();

      if (!this.userLocation) {
        throw new Error('Could not get user location');
      }

      // Create A-Frame scene for location-based AR
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

      // Add camera entity with location tracking
      const camera = document.createElement('a-entity');
      camera.setAttribute('camera', '');
      camera.setAttribute('look-controls', 'enabled: true');
      camera.setAttribute('position', '0 1.6 0');
      camera.setAttribute(
        'gps-projected-camera',
        `simulateLatitude: ${this.userLocation.latitude}; ` +
          `simulateLongitude: ${this.userLocation.longitude}; ` +
          'positionMinAccuracy: 100;'
      );

      aframeScene.appendChild(camera);

      // Add the scene to container
      this.container.appendChild(aframeScene);

      // Set up renderer
      this.renderer.setPixelRatio(1);
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

  async placeModel(
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

  removeModel(modelId: string): void {
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

  updateModelTransform(
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

  private onWindowResize(): void {
    if (this.container) {
      // Update camera
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();

      // Update renderer
      this.renderer.setSize(window.innerWidth, window.innerHeight);

      // Update A-Frame scene size
      const aframeScene = this.container.querySelector('a-scene');
      if (aframeScene) {
        aframeScene.setAttribute(
          'arjs',
          'sourceType: webcam; ' +
            'debugUIEnabled: false; ' +
            'trackingMethod: best; ' +
            'detectionMode: mono; ' +
            'maxDetectionRate: 30;'
        );
      }
    }
  }

  public dispose(): void {
    // Clean up resources
    this.renderer.dispose();
    window.removeEventListener('resize', this.onWindowResize.bind(this));

    // Remove A-Frame scene
    if (this.container) {
      const aframeScene = this.container.querySelector('a-scene');
      if (aframeScene) {
        this.container.removeChild(aframeScene);
      }
    }
  }
}

export default AREngine;
