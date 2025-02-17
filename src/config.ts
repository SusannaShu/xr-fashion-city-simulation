export const config = {
  mapbox: {
    accessToken: process.env.VITE_MAPBOX_ACCESS_TOKEN || '',
  },
  firebase: {
    apiKey: process.env.VITE_FIREBASE_API_KEY || '',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.VITE_FIREBASE_APP_ID || '',
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  },
  ar: {
    defaultDrawingDistance: -1, // meters
    maxDrawingDistance: -5, // meters
    minDrawingDistance: -0.5, // meters
  },
};
