import { storage } from './config';
import { AuthService } from './auth';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  UploadMetadata,
  uploadString,
} from 'firebase/storage';
import type { StorageReference } from 'firebase/storage';
import type { ModelData } from './config';

export class StorageService {
  private static readonly MODELS_PATH = 'models';
  private static readonly THUMBNAILS_PATH = 'thumbnails';

  static async uploadModel(
    file: File,
    metadata: Omit<ModelData, 'id' | 'url' | 'thumbnailUrl'>
  ): Promise<string> {
    try {
      // Ensure user is authenticated
      await AuthService.ensureAuth();

      // Read file as array buffer
      const buffer = await file.arrayBuffer();
      const base64 = await this.arrayBufferToBase64(buffer);

      // Set proper content type and metadata
      const customMetadata: UploadMetadata = {
        contentType: file.type || 'application/octet-stream',
        customMetadata: {
          name: metadata.name,
          designer: JSON.stringify(metadata.designer),
          format: metadata.metadata.format,
          version: metadata.metadata.version,
        },
      };

      // Create a unique filename to avoid collisions
      const timestamp = Date.now();
      const safeFileName = metadata.name
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      const filename = `${safeFileName}_${timestamp}`;
      const modelRef = ref(storage, `${this.MODELS_PATH}/${filename}`);

      // Upload using base64 string
      const snapshot = await uploadString(
        modelRef,
        base64,
        'base64',
        customMetadata
      );
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error in uploadModel:', error);
      throw this.handleStorageError(error);
    }
  }

  static async uploadThumbnail(file: File, modelName: string): Promise<string> {
    try {
      // Ensure user is authenticated
      await AuthService.ensureAuth();

      // Read file as array buffer
      const buffer = await file.arrayBuffer();
      const base64 = await this.arrayBufferToBase64(buffer);

      const timestamp = Date.now();
      const safeFileName = modelName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${safeFileName}_${timestamp}_thumb`;
      const thumbnailRef = ref(storage, `${this.THUMBNAILS_PATH}/${filename}`);

      const customMetadata: UploadMetadata = {
        contentType: 'image/png',
        customMetadata: {
          modelName,
          type: 'thumbnail',
        },
      };

      const snapshot = await uploadString(
        thumbnailRef,
        base64,
        'base64',
        customMetadata
      );
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error in uploadThumbnail:', error);
      throw this.handleStorageError(error);
    }
  }

  private static async arrayBufferToBase64(
    buffer: ArrayBuffer
  ): Promise<string> {
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    let binary = '';
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  static async getModelUrl(modelName: string): Promise<string> {
    try {
      // Ensure user is authenticated
      await AuthService.ensureAuth();

      const modelRef = ref(storage, `${this.MODELS_PATH}/${modelName}`);
      return await getDownloadURL(modelRef);
    } catch (error) {
      console.error('Error in getModelUrl:', error);
      throw this.handleStorageError(error);
    }
  }

  static async listModels(): Promise<StorageReference[]> {
    try {
      // Ensure user is authenticated
      await AuthService.ensureAuth();

      const modelsRef = ref(storage, this.MODELS_PATH);
      const result = await listAll(modelsRef);
      return result.items;
    } catch (error) {
      console.error('Error in listModels:', error);
      throw this.handleStorageError(error);
    }
  }

  private static handleStorageError(error: unknown): Error {
    console.error('Storage error details:', error);

    if (error instanceof Error) {
      // Handle specific Firebase Storage errors
      const errorCode = (error as any).code;
      switch (errorCode) {
        case 'storage/unauthorized':
          return new Error('Access denied. Please check your permissions.');
        case 'storage/canceled':
          return new Error('Upload was canceled.');
        case 'storage/retry-limit-exceeded':
          return new Error(
            'Upload failed due to network issues. Please try again.'
          );
        case 'storage/invalid-checksum':
          return new Error('File upload failed. Please try again.');
        case 'storage/unknown':
          return new Error('An unknown error occurred. Please try again.');
        default:
          if (error.message.includes('auth/configuration-not-found')) {
            return new Error(
              'Firebase Authentication is not properly configured. Please enable Anonymous Authentication in the Firebase Console.'
            );
          }
          if (error.message.includes('auth/operation-not-allowed')) {
            return new Error(
              'Anonymous Authentication is not enabled. Please enable it in the Firebase Console.'
            );
          }
          if (error.message.includes('cors')) {
            return new Error(
              'CORS error: Please check Firebase Storage configuration.'
            );
          }
          return error;
      }
    }

    return new Error('An unexpected error occurred. Please try again.');
  }
}
