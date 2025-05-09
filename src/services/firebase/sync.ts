import { db } from './config';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  DocumentData,
  QuerySnapshot,
  Timestamp,
} from 'firebase/firestore';
import type { ModelMetadata } from './metadata';

type SyncCallback = (data: ModelMetadata) => void;
type ErrorCallback = (error: Error) => void;

export class ModelSyncService {
  private static subscriptions: Map<string, () => void> = new Map();

  static subscribeToModel(
    modelId: string,
    onUpdate: SyncCallback,
    onError?: ErrorCallback
  ): () => void {
    // Unsubscribe from existing subscription if any
    this.unsubscribeFromModel(modelId);

    const unsubscribe = onSnapshot(
      doc(db, 'modelMetadata', modelId),
      snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data() as ModelMetadata & {
            createdAt: Timestamp;
            updatedAt: Timestamp;
          };
          onUpdate({
            ...data,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          });
        }
      },
      error => {
        console.error(`Error syncing model ${modelId}:`, error);
        onError?.(error);
      }
    );

    this.subscriptions.set(modelId, unsubscribe);
    return unsubscribe;
  }

  static subscribeToNearbyModels(
    latitude: number,
    longitude: number,
    radiusKm: number,
    onUpdate: (models: ModelMetadata[]) => void,
    onError?: ErrorCallback
  ): () => void {
    const locationKey = `${latitude},${longitude},${radiusKm}`;
    this.unsubscribeFromModel(locationKey);

    // TODO: Replace with proper geospatial query when implemented
    const q = query(collection(db, 'modelMetadata'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const models = snapshot.docs
          .map(doc => {
            const data = doc.data() as ModelMetadata & {
              createdAt: Timestamp;
              updatedAt: Timestamp;
            };
            return {
              ...data,
              createdAt: data.createdAt.toDate(),
              updatedAt: data.updatedAt.toDate(),
            };
          })
          .filter(model => {
            if (!model.location) return false;

            const distance = this.calculateDistance(
              latitude,
              longitude,
              model.location.latitude,
              model.location.longitude
            );

            return distance <= radiusKm;
          });

        onUpdate(models);
      },
      error => {
        console.error('Error syncing nearby models:', error);
        onError?.(error);
      }
    );

    this.subscriptions.set(locationKey, unsubscribe);
    return unsubscribe;
  }

  static unsubscribeFromModel(key: string): void {
    const unsubscribe = this.subscriptions.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  static unsubscribeAll(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }

  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
