import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import { XREstimatedLight } from 'three/examples/jsm/webxr/XREstimatedLight';
import { ProcessedModel } from '../model/ModelTransformer';

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
  private xrLight: XREstimatedLight | null = null;
  private models: Map<string, THREE.Group> = new Map();
  private hitTestSourceRequested = false;
  private hitTestSource: XRHitTestSource | null = null;
  private reticle: THREE.Mesh;
  private container: HTMLElement | null = null;
  private frameCallback: number | null = null;

  private constructor() {
    // Initialize Three.js components
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.xr.enabled = true;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
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
    this.container = options.container;

    // Set up renderer
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);

    // Add AR button
    const arButton = ARButton.createButton(this.renderer, {
      requiredFeatures: ['hit-test', 'estimated-light'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: this.container },
    });
    this.container.appendChild(arButton);

    // Set up XR session start/end handlers
    this.renderer.xr.addEventListener('sessionstart', () => {
      console.log('AR session started');
      this.setupXRLight();
      options.onStart?.();
    });

    this.renderer.xr.addEventListener('sessionend', () => {
      console.log('AR session ended');
      this.cleanup();
      options.onEnd?.();
    });

    // Start animation loop
    this.renderer.setAnimationLoop(this.render.bind(this));

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private async setupXRLight(): Promise<void> {
    try {
      this.xrLight = new XREstimatedLight(this.renderer);
      this.scene.add(this.xrLight);
    } catch (error) {
      console.warn('Failed to set up XR estimated light:', error);
    }
  }

  private render(timestamp: number, frame: XRFrame | null): void {
    if (frame) {
      const referenceSpace = this.renderer.xr.getReferenceSpace();
      const session = this.renderer.xr.getSession();

      if (referenceSpace && session) {
        // Handle hit testing
        if (!this.hitTestSourceRequested) {
          void session.requestReferenceSpace('viewer').then(viewerSpace => {
            if (viewerSpace && session) {
              void session
                .requestHitTestSource({ space: viewerSpace })
                .then(source => {
                  this.hitTestSource = source;
                })
                .catch(error => {
                  console.error('Error requesting hit test source:', error);
                });
            }
          });
          this.hitTestSourceRequested = true;
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
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
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

    if (this.frameCallback !== null) {
      cancelAnimationFrame(this.frameCallback);
    }

    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }

    this.renderer.dispose();
  }
}
