// src/utils/CloudSaveService.js
//
// Cross-device save/resume: when a player is signed in (Google/Apple via
// Firebase Auth), their in-progress local/AI game is also mirrored to
// Firestore so they can resume it from a different device. Guests
// (not signed in) only ever use the local AsyncStorage save — this file
// simply no-ops for them, so nothing changes for guest play.
//
// Online multiplayer games are NOT saved here — the server is already
// authoritative for those (see server/server.js), and a disconnect/
// reconnect flow for live multiplayer is a different feature than
// single-device save/resume. See useGameStore.persist() for that guard.
//
// ── DATA MODEL ──────────────────────────────────────────────────────
// Firestore collection: `savedGames`
// Document ID: the player's Firebase Auth uid (one in-progress save per
// player, matching the single-save-slot model the local version uses)
// Document shape:
//   {
//     state: <serialized game state, same shape as GameLogic state>,
//     aiColors: string[],
//     aiDifficulty: 'EASY' | 'MEDIUM' | 'HARD',
//     updatedAt: Timestamp,
//   }

import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebaseConfig';

const SAVED_GAMES_COLLECTION = 'savedGames';

export async function saveGameToCloud(uid, payload) {
  if (!isFirebaseConfigured() || !db || !uid) return false;
  try {
    await setDoc(doc(db, SAVED_GAMES_COLLECTION, uid), {
      state: payload.state,
      aiColors: payload.aiColors || [],
      aiDifficulty: payload.aiDifficulty || 'MEDIUM',
      updatedAt: Date.now(), // plain client timestamp — good enough for
      // "which save is newer" comparisons between one device's local save
      // and the cloud copy; server-side serverTimestamp() would require
      // a round trip before we could read it back for that comparison.
    });
    return true;
  } catch (e) {
    console.warn('saveGameToCloud failed:', e?.message);
    return false;
  }
}

export async function fetchGameFromCloud(uid) {
  if (!isFirebaseConfigured() || !db || !uid) return null;
  try {
    const snap = await getDoc(doc(db, SAVED_GAMES_COLLECTION, uid));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn('fetchGameFromCloud failed:', e?.message);
    return null;
  }
}

export async function deleteGameFromCloud(uid) {
  if (!isFirebaseConfigured() || !db || !uid) return false;
  try {
    await deleteDoc(doc(db, SAVED_GAMES_COLLECTION, uid));
    return true;
  } catch (e) {
    console.warn('deleteGameFromCloud failed:', e?.message);
    return false;
  }
}
