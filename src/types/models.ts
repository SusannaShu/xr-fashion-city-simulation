export interface Model {
  id: string;
  name: string;
  url: string;
  position?: {
    x: number;
    y: number;
    z: number;
  };
  rotation?: {
    x: number;
    y: number;
    z: number;
  };
  scale?: {
    x: number;
    y: number;
    z: number;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface ModelInteractionState {
  selectedModel: Model | null;
  isEditing: boolean;
  isDragging: boolean;
  isRotating: boolean;
  isScaling: boolean;
}

export interface ModelViewerProps {
  model: Model;
  onInteraction?: (model: Model) => void;
}

export interface ModelControlsProps {
  model: Model;
  onUpdate: (updates: Partial<Model>) => void;
  onDelete?: (modelId: string) => void;
}

export interface ModelUploaderProps {
  onUpload: (model: Model) => void;
  isLoading?: boolean;
  error?: string;
}
