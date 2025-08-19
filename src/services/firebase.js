// Firebase configuration and initialization
// Configure Firebase using environment variables (.env.local)

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Load Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Check if Firebase is properly configured
const isValidConfig = firebaseConfig.apiKey && 
                      firebaseConfig.apiKey !== 'demo-mode-offline' &&
                      !firebaseConfig.apiKey.includes('demo') &&
                      !firebaseConfig.apiKey.includes('your-')

let auth = null
let db = null

if (isValidConfig) {
  // Initialize Firebase with real config
  try {
    const app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    console.log('🔥 Firebase initialized successfully with real config')
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error)
    auth = null
    db = null
  }
} else {
  // Running in demo/offline mode
  console.warn('⚠️  Firebase running in demo mode')
  console.warn('   To enable full functionality:')
  console.warn('   1. Create a Firebase project')
  console.warn('   2. Copy .env.example to .env.local')
  console.warn('   3. Replace values with your Firebase config')
  
  // Don't initialize Firebase to avoid API errors
  auth = null
  db = null
}

export { auth, db, isValidConfig }