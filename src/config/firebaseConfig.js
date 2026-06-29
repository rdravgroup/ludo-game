// src/config/firebaseConfig.js
//
// ⚠️ SETUP REQUIRED:
//   1. Create a Firebase project at https://console.firebase.google.com
//   2. Add a Web app to it (even for mobile — Expo uses the Firebase Web SDK).
//   3. Copy the config values it gives you into your `.env` file (see
//      `.env.example` in the project root for the exact variable names).
//   4. Enable Authentication providers: Authentication > Sign-in method >
//      enable "Google" and "Apple".
//   5. Create a Firestore database: Firestore Database > Create database
//      (start in production mode, add rules — see firestore.rules.example).
//
// Until `.env` is filled in, `isFirebaseConfigured()` returns false and
// every screen that depends on Firebase (auth buttons, leaderboard) falls
// back to a clearly-labeled guest/mock mode instead of crashing.

import { initializeApp, getApps, getApp } from 'firebase/app';
// getReactNativePersistence is the officially documented way to get
// persisted auth state on React Native (see Firebase's own blog post:
// "Which Firebase SDK do I pick for my React Native project?"). It is
// resolved via @firebase/auth's "react-native" package.json export
// condition, which Metro (unlike plain Node) honors when bundling for a
// native target. This has been a moving target across Firebase/Expo SDK
// versions for some users — if it ever resolves to `undefined` in your
// environment, calling it below throws a TypeError that the inner
// try/catch already catches, falling back to getAuth(app) (auth still
// works, it just won't persist across app restarts). If you hit that
// fallback and want full persistence, pin firebase to a version
// confirmed working with your exact Expo SDK version, or see
// https://github.com/firebase/firebase-js-sdk/issues/7615 for alternatives.
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const PLACEHOLDER_MARKERS = ['AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', undefined, '', null];

export function isFirebaseConfigured() {
  return !PLACEHOLDER_MARKERS.includes(firebaseConfig.apiKey) && !!firebaseConfig.projectId;
}

let app = null;
let authInstance = null;
let dbInstance = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);

    try {
      if (typeof getReactNativePersistence !== 'function') {
        throw new Error('getReactNativePersistence is not available from this firebase version');
      }
      authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (e) {
      // initializeAuth also throws if already initialized (e.g. fast
      // refresh) — either way, fall back to getAuth. Auth still works in
      // this fallback; it just won't persist sign-in across app restarts.
      console.warn(
        '[firebaseConfig] Falling back to in-memory auth persistence:',
        e?.message
      );
      authInstance = getAuth(app);
    }

    dbInstance = getFirestore(app);
  } catch (e) {
    console.warn('Firebase initialization failed:', e?.message);
  }
} else {
  console.warn(
    '[firebaseConfig] EXPO_PUBLIC_FIREBASE_* env vars are not set — ' +
      'running without Firebase. Auth and Firestore leaderboard features ' +
      'will use local/guest fallbacks. See .env.example.'
  );
}

export const auth = authInstance;
export const db = dbInstance;
export default app;
