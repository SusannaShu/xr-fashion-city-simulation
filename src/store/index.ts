import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import modelReducer from './models/modelSlice';

// We'll add these slices as we create them
// import transformReducer from './models/transformSlice';
// import drawingReducer from './ar/drawingSlice';
// import mapReducer from './map/mapSlice';

export const store = configureStore({
  reducer: {
    models: modelReducer,
    // transform: transformReducer,
    // drawing: drawingReducer,
    // map: mapReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['model/setThreeObject'],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          'payload.object3D',
          'payload.scene',
          'payload.camera',
        ],
        // Ignore these paths in the state
        ignoredPaths: ['models.threeObjects', 'ar.camera', 'map.mapInstance'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
