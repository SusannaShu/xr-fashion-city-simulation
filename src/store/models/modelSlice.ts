import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Model } from '../../types/models';
import * as THREE from 'three';

interface ModelState {
  models: Model[];
  selectedModelId: string | null;
  threeObjects: Record<string, THREE.Object3D>;
  isLoading: boolean;
  error: string | null;
}

const initialState: ModelState = {
  models: [],
  selectedModelId: null,
  threeObjects: {},
  isLoading: false,
  error: null,
};

export const modelSlice = createSlice({
  name: 'models',
  initialState,
  reducers: {
    setModels: (state, action: PayloadAction<Model[]>) => {
      state.models = action.payload;
    },
    addModel: (state, action: PayloadAction<Model>) => {
      state.models.push(action.payload);
    },
    updateModel: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Model> }>
    ) => {
      const { id, updates } = action.payload;
      const model = state.models.find(m => m.id === id);
      if (model) {
        Object.assign(model, updates);
      }
    },
    removeModel: (state, action: PayloadAction<string>) => {
      state.models = state.models.filter(model => model.id !== action.payload);
      delete state.threeObjects[action.payload];
      if (state.selectedModelId === action.payload) {
        state.selectedModelId = null;
      }
    },
    setSelectedModel: (state, action: PayloadAction<string | null>) => {
      state.selectedModelId = action.payload;
    },
    setThreeObject: (
      state,
      action: PayloadAction<{ id: string; object: THREE.Object3D }>
    ) => {
      state.threeObjects[action.payload.id] = action.payload.object;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setModels,
  addModel,
  updateModel,
  removeModel,
  setSelectedModel,
  setThreeObject,
  setLoading,
  setError,
} = modelSlice.actions;

export default modelSlice.reducer;
