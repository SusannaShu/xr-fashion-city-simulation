import * as THREE from 'three';
import { StorageService } from '../firebase/storage';
import { ModelMetadataService, ModelMetadata } from '../firebase/metadata';
import { ModelTransformer, ProcessedModel } from './ModelTransformer';

export interface ModelUploadOptions {
  name: string;
  file: File;
  creator: string;
  tags?: string[];
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export class ModelLoader {
  static async uploadAndProcess(
    options: ModelUploadOptions
  ): Promise<ProcessedModel> {
    try {
      // 1. Upload the model file
      const modelUrl = await StorageService.uploadModel(options.file, {
        name: options.name,
        designer: {
          id: options.creator,
          name: options.creator,
        },
        metadata: {
          format: options.file.type,
          size: options.file.size,
          version: '1.0',
          scale: 1,
          position: { x: 0, y: 0, z: 0 },
        },
      });

      // 2. Load the model for processing
      const model = await ModelTransformer.loadModel(modelUrl);

      // 3. Generate thumbnail
      const thumbnailDataUrl = await ModelTransformer.generateThumbnail(model);
      const thumbnailFile = await this.dataUrlToFile(
        thumbnailDataUrl,
        `${options.name}_thumb.png`
      );
      const thumbnailUrl = await StorageService.uploadThumbnail(
        thumbnailFile,
        options.name
      );

      // 4. Process and optimize the model
      ModelTransformer.optimizeGeometry(model);

      // 5. Create metadata
      const metadata: Omit<ModelMetadata, 'id'> = {
        name: options.name,
        url: modelUrl,
        thumbnailUrl,
        creator: options.creator,
        tags: options.tags || [],
        description: options.description || '',
        dimensions: {
          width: 0,
          height: 0,
          depth: 0,
        },
        fileSize: options.file.size,
        format: options.file.type,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        location: options.location || {
          latitude: 48.8612,
          longitude: 2.3364,
        },
        designer: {
          id: options.creator,
          name: options.creator,
        },
        metadata: {
          format: options.file.type,
          size: options.file.size,
          version: '1.0',
          scale: 1,
          position: { x: 0, y: 0, z: 0 },
        },
      };

      // 6. Save metadata
      const metadataId = await ModelMetadataService.createMetadata(metadata);

      // 7. Process the model with metadata
      const processedModel = await ModelTransformer.processModel(model, {
        ...metadata,
        id: metadataId,
      });

      // Update dimensions in metadata
      const size = processedModel.boundingBox.getSize(new THREE.Vector3());
      await ModelMetadataService.updateMetadata(metadataId, {
        dimensions: {
          width: size.x,
          height: size.y,
          depth: size.z,
        },
      });

      return processedModel;
    } catch (error) {
      console.error('Error in uploadAndProcess:', error);
      throw error;
    }
  }

  static async loadExisting(modelId: string): Promise<ProcessedModel> {
    try {
      // 1. Get metadata
      const metadata = await ModelMetadataService.getMetadata(modelId);
      if (!metadata) {
        throw new Error(`Model metadata not found for ID: ${modelId}`);
      }

      // 2. Load and process model
      const model = await ModelTransformer.loadModel(metadata.url);
      ModelTransformer.optimizeGeometry(model);
      return ModelTransformer.processModel(model, metadata);
    } catch (error) {
      console.error('Error in loadExisting:', error);
      throw error;
    }
  }

  private static async dataUrlToFile(
    dataUrl: string,
    filename: string
  ): Promise<File> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: 'image/png' });
  }

  static dispose(): void {
    ModelTransformer.dispose();
  }
}
