import { initializeApp } from 'firebase/app';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getAuth, Auth } from 'firebase/auth';

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || '',
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

const app = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app);
const db: Firestore = getFirestore(app);
const analytics: Analytics | null = firebaseConfig.measurementId
  ? getAnalytics(app)
  : null;

export { app, auth, storage, db, analytics };

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
