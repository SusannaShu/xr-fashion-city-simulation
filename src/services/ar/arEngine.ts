import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import { XREstimatedLight } from 'three/examples/jsm/webxr/XREstimatedLight';
import { ProcessedModel } from '../model/ModelTransformer';
import { LocationService } from './locationService';

// AR.js types
declare const THREEx: any;

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
  hitTestSource?: XRHitTestSource;
}

export class AREngine {
  private static instance: AREngine;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private arToolkitSource: any;
  private arToolkitContext: any;
  private markerControls: any;
  private xrLight: XREstimatedLight | null = null;
  private models: Map<string, THREE.Group> = new Map();
  private hitTestSourceRequested = false;
  private hitTestSource: XRHitTestSource | null = null;
  private reticle: THREE.Mesh;
  private container: HTMLElement | null = null;
  private isUsingARjs = false;
  private locationService: LocationService = LocationService.getInstance();
  private initialLatitude = 0;
  private initialLongitude = 0;

  private constructor() {
    // Initialize Three.js components
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );

    // Create reticle for placement
    const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(
      -Math.PI / 2
    );
    const reticleMaterial = new THREE.MeshBasicMaterial();
    this.reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    this.reticle.matrixAutoUpdate = false;
    this.reticle.visible = false;
    this.scene.add(this.reticle);

    // Add basic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
  }

  static getInstance(): AREngine {
    if (!AREngine.instance) {
      AREngine.instance = new AREngine();
    }
    return AREngine.instance;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  async initialize(options: ARSceneOptions): Promise<void> {
    try {
      this.container = options.container;

      // Set up renderer
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.container.appendChild(this.renderer.domElement);

      // Check if we should use AR.js
      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as any).MSStream;
      const isSafari = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent
      );

      if (!isSafari || !navigator.xr) {
        // Use AR.js for non-Safari browsers or when WebXR is not available
        await this.initializeARjs(options);
      } else {
        // Use WebXR for Safari
        await this.initializeWebXR(options);
      }

      // Handle window resize
      window.addEventListener('resize', this.onWindowResize.bind(this));
    } catch (error) {
      console.error('Failed to initialize AR:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to initialize AR';
      options.onError?.(new Error(`AR initialization failed: ${errorMessage}`));
      throw error;
    }
  }

  private async initializeARjs(options: ARSceneOptions): Promise<void> {
    this.isUsingARjs = true;

    // Get initial location
    const initialLocation = await this.locationService.getCurrentLocation();
    if (initialLocation) {
      this.initialLatitude = initialLocation.latitude;
      this.initialLongitude = initialLocation.longitude;
    }

    // Initialize AR.js source (camera stream)
    this.arToolkitSource = new THREEx.ArToolkitSource({
      sourceType: 'webcam',
      sourceWidth: window.innerWidth,
      sourceHeight: window.innerHeight,
      displayWidth: window.innerWidth,
      displayHeight: window.innerHeight,
    });

    // Initialize AR.js context for location-based AR
    this.arToolkitContext = new THREEx.ArToolkitContext({
      debug: false,
      detectionMode: 'color_and_matrix',
      matrixCodeType: '3x3',
      cameraParametersUrl: undefined,
      maxDetectionRate: 60,
      canvasWidth: window.innerWidth,
      canvasHeight: window.innerHeight,
      imageSmoothingEnabled: true,
    });

    // Handle AR.js initialization
    await new Promise<void>(resolve => {
      this.arToolkitSource.init(() => {
        this.arToolkitSource.onResize();
        this.arToolkitSource.copySizeTo(this.renderer.domElement);

        this.arToolkitContext.init(() => {
          // Update camera projection matrix
          this.camera.projectionMatrix.copy(
            this.arToolkitContext.getProjectionMatrix()
          );

          // Set up location-based scene
          this.setupLocationBasedScene();
          resolve();
        });
      });
    });

    // Start animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (this.arToolkitSource.ready) {
        this.arToolkitContext.update(this.arToolkitSource.domElement);
        this.scene.visible = true;

        // Update camera position based on device orientation
        const location = this.locationService.getCurrentLocation();
        if (location) {
          this.updateCameraFromDeviceOrientation(location);
        }
      }

      this.renderer.render(this.scene, this.camera);
    };
    animate();

    options.onStart?.();
  }

  private setupLocationBasedScene(): void {
    // Set up scene for location-based AR
    this.scene.visible = false;

    // Add a ground plane for reference
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0, // invisible but used for raycasting
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotateX(-Math.PI / 2);
    ground.position.y = -2;
    this.scene.add(ground);

    // Position camera
    this.camera.position.set(0, 2, 0); // 2 meters above ground
    this.camera.lookAt(new THREE.Vector3(0, 2, -1));
  }

  private updateCameraFromDeviceOrientation(location: {
    latitude: number;
    longitude: number;
  }): void {
    if (!this.camera) return;

    // Get device orientation if available
    if (typeof DeviceOrientationEvent !== 'undefined') {
      window.addEventListener(
        'deviceorientation',
        event => {
          if (!event.alpha || !event.beta || !event.gamma) return;

          // Convert degrees to radians
          const alpha = event.alpha * (Math.PI / 180);
          const beta = event.beta * (Math.PI / 180);
          const gamma = event.gamma * (Math.PI / 180);

          // Update camera rotation
          this.camera.rotation.set(
            beta, // X-axis rotation (looking up/down)
            alpha, // Y-axis rotation (looking left/right)
            -gamma // Z-axis rotation (tilting left/right)
          );
        },
        true
      );
    }

    // Update camera position based on GPS
    // Convert GPS coordinates to scene coordinates (simplified)
    const sceneX = (location.longitude - this.initialLongitude) * 111000; // rough meters per degree
    const sceneZ = (location.latitude - this.initialLatitude) * 111000;
    this.camera.position.set(sceneX, 2, sceneZ);
  }

  private async initializeWebXR(options: ARSceneOptions): Promise<void> {
    // Existing WebXR initialization code...
  }

  private render(_timestamp: number, frame: XRFrame | null): void {
    if (frame) {
      const referenceSpace = this.renderer.xr.getReferenceSpace();
      const session = this.renderer.xr.getSession();

      if (referenceSpace && session) {
        // Handle hit testing
        if (!this.hitTestSourceRequested) {
          void (async () => {
            try {
              if (
                !session?.requestReferenceSpace ||
                !session?.requestHitTestSource
              ) {
                throw new Error(
                  'Session does not support required AR features'
                );
              }

              const viewerSpace = await session.requestReferenceSpace('viewer');
              if (!viewerSpace) {
                throw new Error('Failed to get viewer space');
              }

              const hitTestSource = await session.requestHitTestSource({
                space: viewerSpace,
              });

              if (!hitTestSource) {
                throw new Error('Failed to create hit test source');
              }

              this.hitTestSource = hitTestSource;
            } catch (error) {
              console.error('Error requesting hit test source:', error);
            }
            this.hitTestSourceRequested = true;
          })();
        }

        if (this.hitTestSource) {
          const hitTestResults = frame.getHitTestResults(this.hitTestSource);
          if (hitTestResults.length) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);
            if (pose) {
              this.reticle.visible = true;
              this.reticle.matrix.fromArray(pose.transform.matrix);
            }
          }
        }

        // Update XR light if available
        if (this.xrLight) {
          // Cast to any since the type definitions are incomplete
          (this.xrLight as any).update(frame);
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  async placeModel(
    model: ProcessedModel,
    options: PlacementOptions = {}
  ): Promise<void> {
    const modelScene = model.scene.clone();

    if (options.position) {
      modelScene.position.copy(options.position);
    } else if (this.reticle.visible) {
      modelScene.matrix.copy(this.reticle.matrix);
    }

    if (options.rotation) {
      modelScene.rotation.copy(options.rotation);
    }

    if (options.scale) {
      modelScene.scale.copy(options.scale);
    }

    this.scene.add(modelScene);
    this.models.set(model.metadata.id, modelScene);
  }

  removeModel(modelId: string): void {
    const model = this.models.get(modelId);
    if (model) {
      this.scene.remove(model);
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
    if (this.isUsingARjs) {
      if (this.arToolkitSource) {
        this.arToolkitSource.onResizeElement();
        this.arToolkitSource.copyElementSizeTo(this.renderer.domElement);
        if (this.arToolkitContext.arController !== null) {
          this.arToolkitSource.copyElementSizeTo(
            this.arToolkitContext.arController.canvas
          );
        }
      }
    } else {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private cleanup(): void {
    if (this.hitTestSource) {
      this.hitTestSource.cancel();
      this.hitTestSource = null;
    }
    this.hitTestSourceRequested = false;
    this.reticle.visible = false;

    // Clear all models
    this.models.forEach(model => {
      this.scene.remove(model);
    });
    this.models.clear();

    if (this.xrLight) {
      this.scene.remove(this.xrLight);
      this.xrLight = null;
    }
  }

  dispose(): void {
    this.cleanup();
    window.removeEventListener('resize', this.onWindowResize.bind(this));

    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }

    this.renderer.dispose();
  }
}
