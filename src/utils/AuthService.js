// src/utils/AuthService.js
//
// Real Google + Apple sign-in wired to Firebase Auth. Falls back to a
// clearly-labeled guest mode if `.env` Firebase/OAuth values aren't set,
// so the rest of the app (profile, stats, local/AI play, save/resume)
// keeps working without auth.
//
// ── SETUP CHECKLIST ──────────────────────────────────────────────────
// 1. Firebase: fill in EXPO_PUBLIC_FIREBASE_* in .env (see .env.example
//    and src/config/firebaseConfig.js header comment).
// 2. Google Sign-In:
//    a. Google Cloud Console > APIs & Services > Credentials.
//    b. Create OAuth 2.0 Client IDs for: Web, iOS, Android.
//       - iOS: bundle ID must match app.json `ios.bundleIdentifier`.
//       - Android: needs your SHA-1 fingerprint (get it via
//         `eas credentials` or `keytool` for a local keystore).
//    c. Put the three client IDs into .env as EXPO_PUBLIC_GOOGLE_*_CLIENT_ID.
//    d. In Firebase Console > Authentication > Sign-in method, enable
//       Google and paste the Web client ID + secret there too.
// 3. Apple Sign-In (iOS only natively):
//    a. Apple Developer account > enable "Sign in with Apple" capability
//       for your App ID.
//    b. In app.json, add the entitlement (see README "Apple Sign-In Setup").
//    c. In Firebase Console > Authentication > Sign-in method, enable Apple.
// ─────────────────────────────────────────────────────────────────────

import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../config/firebaseConfig';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_IDS = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
};

function placeholderOrMissing(value) {
  return !value || value.includes('xxxxxxxx') || value.includes('XXXX');
}

export function isGoogleSignInConfigured() {
  return (
    isFirebaseConfigured() &&
    !placeholderOrMissing(GOOGLE_CLIENT_IDS.webClientId)
  );
}

export function isAppleSignInAvailableOnDevice() {
  return Platform.OS === 'ios';
}

/**
 * React hook wrapper around expo-auth-session's Google provider.
 * Use from a component: const { request, promptAsync } = useGoogleAuthRequest();
 * Call promptAsync() on button press, then pass the result to
 * completeGoogleSignIn(result).
 */
export function useGoogleAuthRequest() {
  return Google.useIdTokenAuthRequest(GOOGLE_CLIENT_IDS);
}

export async function completeGoogleSignIn(authResult) {
  if (!isFirebaseConfigured() || !auth) {
    console.warn('completeGoogleSignIn: Firebase not configured, skipping.');
    return null;
  }
  if (authResult?.type !== 'success') return null;

  const { id_token } = authResult.params;
  const credential = GoogleAuthProvider.credential(id_token);
  const userCredential = await signInWithCredential(auth, credential);
  const user = userCredential.user;
  return {
    uid: user.uid,
    name: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
}

export async function signInWithApple() {
  if (!isAppleSignInAvailableOnDevice()) {
    console.warn('signInWithApple: Apple Sign-In is only available on iOS.');
    return null;
  }
  if (!isFirebaseConfigured() || !auth) {
    console.warn('signInWithApple: Firebase not configured, skipping.');
    return null;
  }

  try {
    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const provider = new OAuthProvider('apple.com');
    const firebaseCredential = provider.credential({
      idToken: appleCredential.identityToken,
    });

    const userCredential = await signInWithCredential(auth, firebaseCredential);
    const user = userCredential.user;

    const fullName = appleCredential.fullName
      ? [appleCredential.fullName.givenName, appleCredential.fullName.familyName]
          .filter(Boolean)
          .join(' ')
      : null;

    return {
      uid: user.uid,
      name: fullName || user.displayName || 'Player',
      email: appleCredential.email || user.email,
    };
  } catch (e) {
    if (e.code === 'ERR_REQUEST_CANCELED') {
      return null; // user cancelled, not an error
    }
    console.warn('signInWithApple failed:', e?.message);
    throw e;
  }
}

export async function signOut() {
  if (auth) {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Sign out failed:', e?.message);
    }
  }
  return true;
}

export function getCurrentFirebaseUser() {
  return auth?.currentUser || null;
}
