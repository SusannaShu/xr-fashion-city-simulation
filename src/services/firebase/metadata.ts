import { db } from './config';
import {
  doc,
  collection,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  DocumentReference,
  DocumentData,
  Firestore,
} from 'firebase/firestore';
import type { ModelData } from './config';

export interface ModelMetadata extends ModelData {
  version: number;
  createdAt: Date;
  updatedAt: Date;
  creator: string;
  tags: string[];
  description: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  fileSize: number;
  format: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export class ModelMetadataService {
  private static readonly COLLECTION_NAME = 'modelMetadata';

  static async createMetadata(
    metadata: Omit<ModelMetadata, 'id'>
  ): Promise<string> {
    try {
      console.log('Creating metadata:', metadata);
      const metadataRef = doc(collection(db, this.COLLECTION_NAME));
      const timestamp = new Date();

      const metadataWithDefaults: ModelMetadata = {
        ...metadata,
        id: metadataRef.id,
        version: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await setDoc(metadataRef, metadataWithDefaults);
      console.log('Metadata created successfully with ID:', metadataRef.id);
      return metadataRef.id;
    } catch (error) {
      console.error('Error creating metadata:', error);
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          throw new Error(
            'Permission denied. Please check Firestore security rules.'
          );
        } else if (error.message.includes('unavailable')) {
          throw new Error(
            'Firestore service is currently unavailable. Please try again later.'
          );
        }
      }
      throw error;
    }
  }

  static async getMetadata(modelId: string): Promise<ModelMetadata | null> {
    try {
      console.log('Fetching metadata for model:', modelId);
      const metadataRef = doc(db, this.COLLECTION_NAME, modelId);
      const metadataSnap = await getDoc(metadataRef);

      if (!metadataSnap.exists()) {
        console.log('No metadata found for model:', modelId);
        return null;
      }

      const data = {
        ...(metadataSnap.data() as ModelMetadata),
        createdAt: new Date(metadataSnap.data().createdAt.seconds * 1000),
        updatedAt: new Date(metadataSnap.data().updatedAt.seconds * 1000),
      };
      console.log('Metadata retrieved successfully:', data);
      return data;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          throw new Error(
            'Permission denied. Please check Firestore security rules.'
          );
        } else if (error.message.includes('unavailable')) {
          throw new Error(
            'Firestore service is currently unavailable. Please try again later.'
          );
        }
      }
      throw error;
    }
  }

  static async updateMetadata(
    modelId: string,
    updates: Partial<Omit<ModelMetadata, 'id' | 'createdAt' | 'version'>>
  ): Promise<void> {
    try {
      console.log(
        'Updating metadata for model:',
        modelId,
        'with updates:',
        updates
      );
      const metadataRef = doc(db, this.COLLECTION_NAME, modelId);
      const currentMetadata = await this.getMetadata(modelId);

      if (!currentMetadata) {
        throw new Error(`Model metadata not found for ID: ${modelId}`);
      }

      await updateDoc(metadataRef, {
        ...updates,
        version: currentMetadata.version + 1,
        updatedAt: new Date(),
      });
      console.log('Metadata updated successfully');
    } catch (error) {
      console.error('Error updating metadata:', error);
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          throw new Error(
            'Permission denied. Please check Firestore security rules.'
          );
        } else if (error.message.includes('unavailable')) {
          throw new Error(
            'Firestore service is currently unavailable. Please try again later.'
          );
        }
      }
      throw error;
    }
  }

  static async findModelsByTags(tags: string[]): Promise<ModelMetadata[]> {
    try {
      console.log('Finding models by tags:', tags);
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('tags', 'array-contains-any', tags)
      );

      const querySnapshot = await getDocs(q);
      const models = querySnapshot.docs.map(doc => ({
        ...(doc.data() as ModelMetadata),
        createdAt: new Date(doc.data().createdAt.seconds * 1000),
        updatedAt: new Date(doc.data().updatedAt.seconds * 1000),
      }));
      console.log('Found models:', models);
      return models;
    } catch (error) {
      console.error('Error finding models by tags:', error);
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          throw new Error(
            'Permission denied. Please check Firestore security rules.'
          );
        } else if (error.message.includes('unavailable')) {
          throw new Error(
            'Firestore service is currently unavailable. Please try again later.'
          );
        }
      }
      throw error;
    }
  }

  static async findModelsByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number
  ): Promise<ModelMetadata[]> {
    try {
      console.log('Finding models by location:', {
        latitude,
        longitude,
        radiusKm,
      });
      // TODO: Implement geospatial query once we set up geolocation indexing
      const q = query(collection(db, this.COLLECTION_NAME));
      const querySnapshot = await getDocs(q);

      // Basic distance calculation (this should be moved to a proper geospatial query)
      const models = querySnapshot.docs
        .map(doc => ({
          ...(doc.data() as ModelMetadata),
          createdAt: new Date(doc.data().createdAt.seconds * 1000),
          updatedAt: new Date(doc.data().updatedAt.seconds * 1000),
        }))
        .filter(metadata => {
          if (!metadata.location) return false;

          const distance = this.calculateDistance(
            latitude,
            longitude,
            metadata.location.latitude,
            metadata.location.longitude
          );

          return distance <= radiusKm;
        });

      console.log('Found models:', models);
      return models;
    } catch (error) {
      console.error('Error finding models by location:', error);
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          throw new Error(
            'Permission denied. Please check Firestore security rules.'
          );
        } else if (error.message.includes('unavailable')) {
          throw new Error(
            'Firestore service is currently unavailable. Please try again later.'
          );
        }
      }
      throw error;
    }
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
