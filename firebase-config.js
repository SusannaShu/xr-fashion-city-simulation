// Import Firebase from the CDN modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUPDWdz5gup52-t3LqoS0F7ltu1tShEyQ",
  authDomain: "susu-virtual-space.firebaseapp.com",
  projectId: "susu-virtual-space",
  storageBucket: "susu-virtual-space.firebasestorage.app",
  messagingSenderId: "758278754335",
  appId: "1:758278754335:web:532416edffe0aaf88fc52a",
  measurementId: "G-0RP598KKPX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics }; 