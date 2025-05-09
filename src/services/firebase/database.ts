import { db } from './config';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  GeoPoint,
  DocumentData,
} from 'firebase/firestore';
import type { DrawingData, ModelData } from './config';

export class DatabaseService {
  private static readonly DRAWINGS_COLLECTION = 'drawings';
  private static readonly MODELS_COLLECTION = 'models';
  private static readonly VISIBILITY_RADIUS = 0.1; // 100 meters in kilometers

  static async saveDrawing(
    drawing: Omit<DrawingData, 'timestamp'>
  ): Promise<string> {
    const docRef = await addDoc(collection(db, this.DRAWINGS_COLLECTION), {
      ...drawing,
      timestamp: new Date(),
    });
    return docRef.id;
  }

  static async getNearbyDrawings(
    lat: number,
    lng: number
  ): Promise<DrawingData[]> {
    const drawingsRef = collection(db, this.DRAWINGS_COLLECTION);
    const latRange = 0.001; // roughly 100m in latitude
    const lngRange = 0.001 / Math.cos((lat * Math.PI) / 180); // adjust for longitude

    const q = query(
      drawingsRef,
      where('location.lat', '>=', lat - latRange),
      where('location.lat', '<=', lat + latRange)
    );

    const querySnapshot = await getDocs(q);
    const drawings: DrawingData[] = [];

    querySnapshot.forEach(doc => {
      const data = doc.data() as DrawingData;
      if (
        data.location.lng >= lng - lngRange &&
        data.location.lng <= lng + lngRange
      ) {
        drawings.push(data);
      }
    });

    return drawings;
  }

  static async saveModel(model: Omit<ModelData, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, this.MODELS_COLLECTION), model);
    return docRef.id;
  }

  static async getModelsAtLocation(
    lat: number,
    lng: number
  ): Promise<ModelData[]> {
    // Similar to getNearbyDrawings but for models
    const modelsRef = collection(db, this.MODELS_COLLECTION);
    // Implementation depends on how you want to query models
    return [];
  }
}
