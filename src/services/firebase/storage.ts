import { storage } from './config';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import type { StorageReference, FirebaseStorage } from 'firebase/storage';
import type { ModelData } from './config';

export class StorageService {
  private static readonly MODELS_PATH = 'models';
  private static readonly THUMBNAILS_PATH = 'thumbnails';

  static async uploadModel(
    file: File,
    metadata: Omit<ModelData, 'id' | 'url' | 'thumbnailUrl'>
  ): Promise<string> {
    const modelRef = ref(storage, `${this.MODELS_PATH}/${metadata.name}`);
    await uploadBytes(modelRef, file);
    return getDownloadURL(modelRef);
  }

  static async uploadThumbnail(file: File, modelName: string): Promise<string> {
    const thumbnailRef = ref(storage, `${this.THUMBNAILS_PATH}/${modelName}`);
    await uploadBytes(thumbnailRef, file);
    return getDownloadURL(thumbnailRef);
  }

  static async getModelUrl(modelName: string): Promise<string> {
    const modelRef = ref(storage, `${this.MODELS_PATH}/${modelName}`);
    return getDownloadURL(modelRef);
  }

  static async listModels(): Promise<StorageReference[]> {
    const modelsRef = ref(storage, this.MODELS_PATH);
    const result = await listAll(modelsRef);
    return result.items;
  }
}
