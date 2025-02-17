import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  addModel,
  updateModel,
  removeModel,
  setSelectedModel,
  setThreeObject,
} from '../store/models/modelSlice';
import { Model } from '../types/models';
import * as THREE from 'three';

export const useModel = () => {
  const dispatch = useAppDispatch();
  const models = useAppSelector(state => state.models.models);
  const selectedModelId = useAppSelector(state => state.models.selectedModelId);
  const selectedModel = useAppSelector(state =>
    state.models.models.find(
      (m: Model) => m.id === state.models.selectedModelId
    )
  );
  const threeObjects = useAppSelector(state => state.models.threeObjects);
  const isLoading = useAppSelector(state => state.models.isLoading);
  const error = useAppSelector(state => state.models.error);

  const selectModel = useCallback(
    (modelId: string | null) => {
      dispatch(setSelectedModel(modelId));
    },
    [dispatch]
  );

  const addNewModel = useCallback(
    (model: Model) => {
      dispatch(addModel(model));
    },
    [dispatch]
  );

  const updateModelData = useCallback(
    (id: string, updates: Partial<Model>) => {
      dispatch(updateModel({ id, updates }));
    },
    [dispatch]
  );

  const deleteModel = useCallback(
    (id: string) => {
      dispatch(removeModel(id));
    },
    [dispatch]
  );

  const setModelObject = useCallback(
    (id: string, object: THREE.Object3D) => {
      dispatch(setThreeObject({ id, object }));
    },
    [dispatch]
  );

  return {
    // State
    models,
    selectedModelId,
    selectedModel,
    threeObjects,
    isLoading,
    error,

    // Actions
    selectModel,
    addNewModel,
    updateModelData,
    deleteModel,
    setModelObject,
  };
};
