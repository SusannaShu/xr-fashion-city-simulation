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

  initialize(scene: THREE.Scene): void {
    this.scene = scene;
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

    // Create tube geometry
    const tubeGeometry = new THREE.TubeGeometry(
      stroke.curve,
      stroke.points.length * 3, // segments
      stroke.style.width / 2, // radius
      8, // radialSegments
      false // closed
    );

    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: stroke.style.color,
      opacity: stroke.style.opacity ?? 1.0,
      transparent: (stroke.style.opacity ?? 1.0) < 1.0,
      roughness: 0.5,
      metalness: 0.5,
    });

    if (stroke.style.texture) {
      material.map = stroke.style.texture;
    }

    // Create mesh
    stroke.mesh = new THREE.Mesh(tubeGeometry, material);
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
    this.clearStrokes();
    this.drawingUpdateCallbacks.clear();
    this.scene = null;
  }
}
