export interface ModelMetadata {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
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
  version: number;
  createdAt: Date;
  updatedAt: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  designer: {
    id: string;
    name: string;
  };
  metadata: {
    format: string;
    size: number;
    version: string;
    scale: number;
    position: {
      x: number;
      y: number;
      z: number;
    };
  };
}

export class ModelMetadataService {
  private static readonly susannaModel: ModelMetadata = {
    id: 'susanna-shoes-preloaded',
    name: 'Susanna Heel',
    url: '/models/Susanna_heel.glb',
    thumbnailUrl: '',
    creator: 'SHEYOU',
    tags: ['shoes', 'fashion', 'preloaded'],
    description: 'Floating Susanna Heel installation above the Louvre',
    dimensions: {
      width: 1,
      height: 1,
      depth: 1,
    },
    fileSize: 14000000,
    format: 'model/gltf-binary',
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    location: {
      latitude: 48.8612,
      longitude: 2.3364,
    },
    designer: {
      id: 'sheyou',
      name: 'SHEYOU',
    },
    metadata: {
      format: 'model/gltf-binary',
      size: 14000000,
      version: '1.0',
      scale: 50,
      position: {
        x: 0,
        y: 100,
        z: 0,
      },
    },
  };

  static async initializePreloadedModels(): Promise<void> {
    console.log('Preloaded Susanna model initialized');
  }

  static async findModelsByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number
  ): Promise<ModelMetadata[]> {
    console.log('Finding models by location:', {
      latitude,
      longitude,
      radiusKm,
    });

    const distance = this.calculateDistance(
      latitude,
      longitude,
      this.susannaModel.location.latitude,
      this.susannaModel.location.longitude
    );

    return distance <= radiusKm ? [this.susannaModel] : [];
  }

  static async createMetadata(
    metadata: Omit<ModelMetadata, 'id'>
  ): Promise<string> {
    // For now, just return a fixed ID since we're only using preloaded models
    return 'susanna-shoes-preloaded';
  }

  static async updateMetadata(
    id: string,
    update: Partial<ModelMetadata>
  ): Promise<void> {
    // No-op for now since we're only using preloaded models
    console.log('Updating metadata for model:', id, update);
  }

  static async getMetadata(id: string): Promise<ModelMetadata | null> {
    // Only return the Susanna model for now
    return id === 'susanna-shoes-preloaded' ? this.susannaModel : null;
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
