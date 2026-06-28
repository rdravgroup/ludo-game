// src/utils/LeaderboardService.js
//
// Real Firestore-backed leaderboard. Reads top players by wins from a
// `players` collection, and pushes the local profile's stats up whenever
// they change (see syncProfileToCloud, called from useProfileStore and
// ProfileScreen after sign-in).
//
// ── DATA MODEL ──────────────────────────────────────────────────────
// Firestore collection: `players`
// Document ID: the Firebase Auth `uid` (stable across sessions/devices)
// Document shape:
//   {
//     username: string,
//     avatarId: number,
//     wins: number,
//     losses: number,
//     gamesPlayed: number,
//     tokensCaptured: number,
//     friendUids: string[],   // for the "friends" tab — see note below
//     updatedAt: Timestamp,
// }
//
// ── FRIENDS TAB NOTE ────────────────────────────────────────────────
// A real friends graph needs its own design (friend requests, mutual
// confirmation, etc.) which is out of scope here. `fetchFriendsLeaderboard`
// currently reads the same `players` collection filtered to UIDs listed in
// the current user's `friendUids` array, so the plumbing is real and
// ready — you just need to build a UI for adding friends (e.g. by
// username search) that appends to `friendUids`.
//
// Until Firebase is configured (.env), every function below transparently
// falls back to local mock data so the screen is fully demoable offline.

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebaseConfig';
import { getCurrentFirebaseUser } from './AuthService';

const PLAYERS_COLLECTION = 'players';
const GLOBAL_LIMIT = 50;

const MOCK_GLOBAL = [
  { id: 'g1', username: 'DiceKing', avatarId: 0, wins: 142 },
  { id: 'g2', username: 'TokenTamer', avatarId: 1, wins: 118 },
  { id: 'g3', username: 'RollMaster', avatarId: 2, wins: 97 },
  { id: 'g4', username: 'LudoLegend', avatarId: 3, wins: 81 },
  { id: 'g5', username: 'SixStreak', avatarId: 4, wins: 64 },
];

const MOCK_FRIENDS = [
  { id: 'f1', username: 'Alex', avatarId: 5, wins: 23 },
  { id: 'f2', username: 'Priya', avatarId: 6, wins: 19 },
  { id: 'f3', username: 'Sam', avatarId: 7, wins: 11 },
];

const AVATARS = ['🦁', '🐯', '🐼', '🦊', '🐸', '🐵', '🦄', '🐲'];

function withEmoji(entries) {
  return entries.map((e) => ({ ...e, avatar: AVATARS[(e.avatarId || 0) % AVATARS.length] }));
}

/** Push the local profile's current stats up to Firestore (no-op if not configured/signed in). */
export async function syncProfileToCloud(profile) {
  if (!isFirebaseConfigured() || !db) return false;
  const user = getCurrentFirebaseUser();
  const uid = profile.uid || user?.uid;
  if (!uid) return false; // not signed in — nothing to sync to

  try {
    await setDoc(
      doc(db, PLAYERS_COLLECTION, uid),
      {
        username: profile.username,
        avatarId: profile.avatarId || 0,
        wins: profile.stats?.wins ?? 0,
        losses: profile.stats?.losses ?? 0,
        gamesPlayed: profile.stats?.gamesPlayed ?? 0,
        tokensCaptured: profile.stats?.tokensCaptured ?? 0,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.warn('syncProfileToCloud failed:', e?.message);
    return false;
  }
}

/** Pull this player's cloud-saved stats (used to merge across devices on sign-in). */
export async function fetchCloudProfile(uid) {
  if (!isFirebaseConfigured() || !db || !uid) return null;
  try {
    const snap = await getDoc(doc(db, PLAYERS_COLLECTION, uid));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn('fetchCloudProfile failed:', e?.message);
    return null;
  }
}

export async function fetchGlobalLeaderboard() {
  if (!isFirebaseConfigured() || !db) {
    await new Promise((r) => setTimeout(r, 300));
    return withEmoji(MOCK_GLOBAL);
  }

  try {
    const q = query(
      collection(db, PLAYERS_COLLECTION),
      orderBy('wins', 'desc'),
      limit(GLOBAL_LIMIT)
    );
    const snap = await getDocs(q);
    const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return withEmoji(entries);
  } catch (e) {
    console.warn('fetchGlobalLeaderboard failed, falling back to mock data:', e?.message);
    return withEmoji(MOCK_GLOBAL);
  }
}

export async function fetchFriendsLeaderboard() {
  if (!isFirebaseConfigured() || !db) {
    await new Promise((r) => setTimeout(r, 300));
    return withEmoji(MOCK_FRIENDS);
  }

  const user = getCurrentFirebaseUser();
  if (!user) return withEmoji(MOCK_FRIENDS); // guest — no friend graph yet

  try {
    const myDoc = await getDoc(doc(db, PLAYERS_COLLECTION, user.uid));
    const friendUids = myDoc.exists() ? myDoc.data().friendUids || [] : [];
    if (friendUids.length === 0) return [];

    // Firestore 'in' queries support up to 30 values per query.
    const batch = friendUids.slice(0, 30);
    const q = query(collection(db, PLAYERS_COLLECTION), where('__name__', 'in', batch));
    const snap = await getDocs(q);
    const entries = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.wins || 0) - (a.wins || 0));
    return withEmoji(entries);
  } catch (e) {
    console.warn('fetchFriendsLeaderboard failed, falling back to mock data:', e?.message);
    return withEmoji(MOCK_FRIENDS);
  }
}

/** Add a UID to the current user's friends list by their player document ID. */
export async function addFriendByUid(friendUid) {
  if (!isFirebaseConfigured() || !db) {
    console.warn('addFriendByUid: Firebase not configured.');
    return false;
  }
  const user = getCurrentFirebaseUser();
  if (!user) return false;

  try {
    const myRef = doc(db, PLAYERS_COLLECTION, user.uid);
    const mySnap = await getDoc(myRef);
    const current = mySnap.exists() ? mySnap.data().friendUids || [] : [];
    if (current.includes(friendUid)) return true;
    await setDoc(myRef, { friendUids: [...current, friendUid] }, { merge: true });
    return true;
  } catch (e) {
    console.warn('addFriendByUid failed:', e?.message);
    return false;
  }
}
