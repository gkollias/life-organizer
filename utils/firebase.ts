// Firebase configuration
// src/firebase/config.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCcOS2V5iYk7xwbzyNiAQu3dDqNMWsbwjU",
  authDomain: "life-organizer-gk.firebaseapp.com",
  projectId: "life-organizer-gk",
  storageBucket: "life-organizer-gk.firebasestorage.app",
  messagingSenderId: "674209590187",
  appId: "1:674209590187:web:8ee303aa0934907873c0ee",
  measurementId: "G-V8DX06D9BG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);
const messaging = getMessaging(app);

export { app, auth, db, storage, functions, messaging };