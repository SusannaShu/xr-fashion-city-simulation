import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Helper function to safely get environment variables
const getEnvVar = (key: string): string => {
  const value = import.meta.env[key] || process.env[key];
  if (!value) {
    console.warn(`Environment variable ${key} is not set`);
  }
  return value || '';
};

// Debug: Log environment access method
console.log('Environment access check:', {
  'import.meta.env': import.meta.env ? 'available' : 'unavailable',
  'process.env': process.env ? 'available' : 'unavailable',
});

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID'),
};

// Debug: Log the final config object
console.log('Firebase Config:', firebaseConfig);

// Validate required config values
if (!firebaseConfig.projectId) {
  console.error('Firebase Config is missing projectId:', firebaseConfig);
  throw new Error('Firebase Project ID is not set in environment variables');
}

if (!firebaseConfig.apiKey) {
  console.error('Firebase Config is missing apiKey:', firebaseConfig);
  throw new Error('Firebase API Key is not set in environment variables');
}

let app;
let storage;
let db: Firestore;
let analytics;

try {
  console.log('Attempting to initialize Firebase with config:', firebaseConfig);
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
  storage = getStorage(app);
  db = getFirestore(app);
  analytics = firebaseConfig.measurementId ? getAnalytics(app) : null;
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

export { app, storage, db, analytics };

// Type definitions for Firebase data
export interface DrawingData {
  points: Array<{
    x: number;
    y: number;
    z: number;
  }>;
  color: string;
  width: number;
  timestamp: Date;
  location: {
    lat: number;
    lng: number;
  };
}

export interface ModelData {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  designer: {
    id: string;
    name: string;
  };
  metadata: {
    format: string;
    size: number;
    version: string;
    scale?: number;
    position?: {
      x: number;
      y: number;
      z: number;
    };
  };
}
