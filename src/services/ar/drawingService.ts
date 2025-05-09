import * as THREE from 'three';
import { DrawingData } from '../firebase/config';
import { LocationService } from './locationService';

export interface DrawingPoint {
  position: THREE.Vector3;
  pressure?: number;
  timestamp: number;
}

export interface StrokeStyle {
  color: string;
  width: number;
  opacity?: number;
  texture?: THREE.Texture;
}

export interface Stroke {
  id: string;
  points: DrawingPoint[];
  style: StrokeStyle;
  mesh?: THREE.Mesh;
  curve?: THREE.CatmullRomCurve3;
}

export class DrawingService {
  private static instance: DrawingService;
  private scene: THREE.Scene | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private isBasicMode = false;
  private currentStroke: Stroke | null = null;
  private strokes: Map<string, Stroke> = new Map();
  private locationService: LocationService;
  private drawingUpdateCallbacks: Set<(stroke: Stroke) => void> = new Set();

  private constructor() {
    this.locationService = LocationService.getInstance();
  }

  static getInstance(): DrawingService {
    if (!DrawingService.instance) {
      DrawingService.instance = new DrawingService();
    }
    return DrawingService.instance;
  }

  initialize(
    target: THREE.Scene | HTMLCanvasElement,
    useBasicMode = false
  ): void {
    this.isBasicMode = useBasicMode;

    if (useBasicMode) {
      if (!(target instanceof HTMLCanvasElement)) {
        throw new Error('Basic mode requires an HTMLCanvasElement');
      }
      this.canvas = target;
      this.context = this.canvas.getContext('2d');
      this.setupBasicDrawing();
    } else {
      if (!(target instanceof THREE.Scene)) {
        throw new Error('WebXR mode requires a THREE.Scene');
      }
      this.scene = target;
      this.setupWebXRDrawing();
    }
  }

  private setupBasicDrawing(): void {
    if (!this.canvas || !this.context) return;

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentBrushSize = 3; // Default brush size

    const draw = (e: TouchEvent | MouseEvent) => {
      if (!isDrawing || !this.context) return;

      const rect = this.canvas!.getBoundingClientRect();
      const x = e instanceof TouchEvent ? e.touches[0].clientX : e.clientX;
      const y = e instanceof TouchEvent ? e.touches[0].clientY : e.clientY;
      const clientX = x - rect.left;
      const clientY = y - rect.top;

      // Get pressure for brush size modulation (if available)
      const pressure =
        e instanceof TouchEvent && 'force' in e.touches[0]
          ? e.touches[0].force
          : 1.0;

      this.context.beginPath();
      this.context.moveTo(lastX, lastY);
      this.context.lineTo(clientX, clientY);
      this.context.strokeStyle = '#FF69B4'; // Hot Pink
      this.context.lineWidth = currentBrushSize * pressure;
      this.context.lineCap = 'round';
      this.context.lineJoin = 'round';
      this.context.stroke();

      lastX = clientX;
      lastY = clientY;
    };

    const startDrawing = (e: TouchEvent | MouseEvent) => {
      isDrawing = true;
      const rect = this.canvas!.getBoundingClientRect();
      lastX =
        (e instanceof TouchEvent ? e.touches[0].clientX : e.clientX) -
        rect.left;
      lastY =
        (e instanceof TouchEvent ? e.touches[0].clientY : e.clientY) - rect.top;
    };

    const stopDrawing = () => {
      isDrawing = false;
    };

    // Touch events
    this.canvas.addEventListener('touchstart', startDrawing);
    this.canvas.addEventListener('touchmove', draw);
    this.canvas.addEventListener('touchend', stopDrawing);

    // Mouse events (for testing)
    this.canvas.addEventListener('mousedown', startDrawing);
    this.canvas.addEventListener('mousemove', draw);
    this.canvas.addEventListener('mouseup', stopDrawing);
    this.canvas.addEventListener('mouseout', stopDrawing);

    // Method to update brush size
    (window as any).updateBrushSize = (size: number) => {
      currentBrushSize = Math.max(1, Math.min(50, size)); // Clamp between 1 and 50
    };
  }

  private setupWebXRDrawing(): void {
    // Existing WebXR drawing setup code
  }

  startStroke(style: StrokeStyle): string {
    const strokeId = crypto.randomUUID();
    this.currentStroke = {
      id: strokeId,
      points: [],
      style,
    };
    this.strokes.set(strokeId, this.currentStroke);
    return strokeId;
  }

  addPoint(point: THREE.Vector3, pressure = 1.0): void {
    if (!this.currentStroke || !this.scene) return;

    const drawingPoint: DrawingPoint = {
      position: point.clone(),
      pressure,
      timestamp: Date.now(),
    };

    this.currentStroke.points.push(drawingPoint);
    this.updateStrokeMesh(this.currentStroke);

    // Notify subscribers
    this.drawingUpdateCallbacks.forEach(callback => {
      callback(this.currentStroke!);
    });
  }

  endStroke(): Stroke | null {
    if (!this.currentStroke) return null;

    const completedStroke = { ...this.currentStroke };
    this.currentStroke = null;
    return completedStroke;
  }

  private updateStrokeMesh(stroke: Stroke): void {
    if (!this.scene || stroke.points.length < 2) return;

    // Remove existing mesh if any
    if (stroke.mesh) {
      this.scene.remove(stroke.mesh);
    }

    // Create curve from points
    const points = stroke.points.map(p => p.position);
    stroke.curve = new THREE.CatmullRomCurve3(points);

    // Create tube geometry with variable radius based on pressure
    const radiusArray = stroke.points.map(
      p => ((p.pressure || 1.0) * stroke.style.width) / 2
    );
    const tubeGeometry = new THREE.TubeGeometry(
      stroke.curve,
      stroke.points.length * 3, // segments
      stroke.style.width / 2, // base radius
      8, // radialSegments
      false // closed
    );

    // Create material with better visual appearance
    const material = new THREE.MeshStandardMaterial({
      color: stroke.style.color,
      opacity: stroke.style.opacity ?? 1.0,
      transparent: (stroke.style.opacity ?? 1.0) < 1.0,
      roughness: 0.3,
      metalness: 0.1,
      emissive: stroke.style.color,
      emissiveIntensity: 0.2,
    });

    if (stroke.style.texture) {
      material.map = stroke.style.texture;
    }

    // Create mesh
    stroke.mesh = new THREE.Mesh(tubeGeometry, material);

    // Add subtle bloom effect
    const bloomPass = new THREE.Mesh(
      tubeGeometry,
      new THREE.MeshBasicMaterial({
        color: stroke.style.color,
        transparent: true,
        opacity: 0.1,
      })
    );
    bloomPass.scale.multiplyScalar(1.1);
    stroke.mesh.add(bloomPass);

    this.scene.add(stroke.mesh);
  }

  getStroke(strokeId: string): Stroke | undefined {
    return this.strokes.get(strokeId);
  }

  getAllStrokes(): Stroke[] {
    return Array.from(this.strokes.values());
  }

  clearStrokes(): void {
    if (!this.scene) return;

    // Remove all stroke meshes from scene
    this.strokes.forEach(stroke => {
      if (stroke.mesh) {
        this.scene!.remove(stroke.mesh);
      }
    });

    this.strokes.clear();
    this.currentStroke = null;
  }

  async saveDrawing(): Promise<DrawingData> {
    const location = this.locationService.getCurrentLocation();
    if (!location) {
      throw new Error('Location not available');
    }

    const drawingData: DrawingData = {
      points: this.getAllStrokes().flatMap(stroke =>
        stroke.points.map(point => ({
          x: point.position.x,
          y: point.position.y,
          z: point.position.z,
        }))
      ),
      color: this.currentStroke?.style.color || '#000000',
      width: this.currentStroke?.style.width || 0.01,
      timestamp: new Date(),
      location: {
        lat: location.latitude,
        lng: location.longitude,
      },
    };

    return drawingData;
  }

  onDrawingUpdate(callback: (stroke: Stroke) => void): () => void {
    this.drawingUpdateCallbacks.add(callback);
    return () => this.drawingUpdateCallbacks.delete(callback);
  }

  dispose(): void {
    if (this.isBasicMode && this.canvas) {
      // Remove all event listeners
      this.canvas.replaceWith(this.canvas.cloneNode(true));
      this.canvas = null;
      this.context = null;
    }
    this.clearStrokes();
    this.drawingUpdateCallbacks.clear();
    this.scene = null;
  }

  // Add method to update brush size
  setBrushSize(size: number): void {
    if (this.isBasicMode) {
      (window as any).updateBrushSize?.(size);
    } else {
      // Update current stroke style if exists
      if (this.currentStroke) {
        this.currentStroke.style.width = size;
      }
    }
  }

  // Add method to get current brush size
  getBrushSize(): number {
    if (this.isBasicMode) {
      return (window as any).currentBrushSize || 3;
    } else {
      return this.currentStroke?.style.width || 0.01;
    }
  }
}
