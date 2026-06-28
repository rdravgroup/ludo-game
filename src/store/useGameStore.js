// src/store/useGameStore.js
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createInitialGameState,
  getLegalMoves,
  applyMove,
  advanceTurn,
  checkGameOver,
  rollDice,
  getCurrentColor,
} from '../utils/GameLogic';
import { chooseAIMove, AIDifficulty } from '../utils/AI';
import { saveGameToCloud, fetchGameFromCloud, deleteGameFromCloud } from '../utils/CloudSaveService';
import { getCurrentFirebaseUser } from '../utils/AuthService';

const SAVE_KEY = '@ludo/savedGame';

export const useGameStore = create((set, get) => ({
  state: null,
  pendingMoves: [],
  isAnimating: false,
  aiColors: [], // colors controlled by AI in this session
  aiDifficulty: AIDifficulty.MEDIUM,

  startGame: (activeColors, mode = 'local', aiColors = [], aiDifficulty = AIDifficulty.MEDIUM) => {
    const initial = createInitialGameState(activeColors, mode);
    set({
      state: initial,
      pendingMoves: [],
      aiColors,
      aiDifficulty: aiDifficulty || AIDifficulty.MEDIUM,
      isAnimating: false,
    });
    get().persist();
  },

  rollCurrentDice: () => {
    const { state } = get();
    if (!state || state.diceRolled || state.status !== 'PLAYING') return null;
    const value = rollDice();
    const consecutiveSixes =
      value === 6 ? state.consecutiveSixes + 1 : 0;
    const moves = getLegalMoves(state, value);

    set({
      state: {
        ...state,
        diceValue: value,
        diceRolled: true,
        consecutiveSixes,
      },
      pendingMoves: moves,
    });
    get().persist();
    return { value, moves };
  },

  /** Player taps a token to move it. Returns move metadata for animation. */
  selectMove: (tokenId) => {
    const { state, pendingMoves } = get();
    if (!state) return null;
    const move = pendingMoves.find((m) => m.tokenId === tokenId);
    if (!move) return null;

    const { newState, result } = applyMove(state, move);
    const { isOver, winner } = checkGameOver(newState);

    let finalState = newState;
    if (isOver) {
      finalState = { ...newState, status: 'WON', winner };
    } else {
      finalState = advanceTurn(newState, result.extraTurn);
    }

    set({ state: finalState, pendingMoves: [] });
    get().persist();
    return { move, result, isOver, winner };
  },

  /** Auto-resolves the AI's turn: roll + pick best move. Caller handles timing/animation. */
  playAITurn: () => {
    const { state, aiDifficulty } = get();
    if (!state) return null;
    const value = rollDice();
    const stateWithRoll = {
      ...state,
      diceValue: value,
      diceRolled: true,
      consecutiveSixes: value === 6 ? state.consecutiveSixes + 1 : 0,
    };
    const moves = getLegalMoves(stateWithRoll, value);

    if (moves.length === 0) {
      const next = advanceTurn(stateWithRoll, false);
      set({ state: next, pendingMoves: [] });
      get().persist();
      return { value, move: null, result: null, isOver: false, winner: null };
    }

    const move = chooseAIMove(stateWithRoll, value, aiDifficulty);
    const { newState, result } = applyMove(stateWithRoll, move);
    const { isOver, winner } = checkGameOver(newState);

    let finalState = newState;
    if (isOver) {
      finalState = { ...newState, status: 'WON', winner };
    } else {
      finalState = advanceTurn(newState, result.extraTurn);
    }

    set({ state: finalState, pendingMoves: [] });
    get().persist();
    return { value, move, result, isOver, winner };
  },

  skipTurnNoMoves: () => {
    const { state } = get();
    if (!state) return;
    const next = advanceTurn(state, false);
    set({ state: next, pendingMoves: [] });
    get().persist();
  },

  pauseGame: () => {
    const { state } = get();
    if (!state) return;
    set({ state: { ...state, status: 'PAUSED' } });
    get().persist();
  },

  resumeGame: () => {
    const { state } = get();
    if (!state) return;
    set({ state: { ...state, status: 'PLAYING' } });
  },

  setAnimating: (val) => set({ isAnimating: val }),

  /**
   * Persists to AsyncStorage immediately (fast, always available offline),
   * and fire-and-forget syncs to Firestore if signed in (so a resume is
   * possible from a different device too — see CloudSaveService.js).
   * Local-only games (mode 'local'/'ai' with no auth) never touch the
   * network here, so there's no behavior change for guests.
   */
  persist: async () => {
    const { state, aiColors, aiDifficulty } = get();
    if (!state) return;
    const payload = { state, aiColors, aiDifficulty, updatedAt: Date.now() };
    try {
      await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to persist game locally', e);
    }

    const user = getCurrentFirebaseUser();
    if (user && state.mode === 'online') {
      // Online games are already authoritative on the server — no need to
      // also cloud-save the client's local mirror of that state.
      return;
    }
    if (user) {
      saveGameToCloud(user.uid, payload); // fire-and-forget, no await
    }
  },

  /**
   * Loads a saved game, preferring the most recently updated copy between
   * the local AsyncStorage save and (if signed in) the cloud save — so
   * resuming works correctly whether the player last played on this
   * device or another one.
   */
  loadSavedGame: async () => {
    let localPayload = null;
    try {
      const raw = await AsyncStorage.getItem(SAVE_KEY);
      if (raw) localPayload = JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load local saved game', e);
    }

    const user = getCurrentFirebaseUser();
    let cloudPayload = null;
    if (user) {
      cloudPayload = await fetchGameFromCloud(user.uid);
    }

    const candidates = [localPayload, cloudPayload].filter(
      (p) => p && p.state && p.state.status !== 'WON'
    );
    if (candidates.length === 0) return false;

    // Prefer whichever has a more recent updatedAt (cloud payload carries
    // this; local payload is assumed "now" if cloud doesn't beat it).
    const chosen = candidates.reduce((best, candidate) => {
      if (!best) return candidate;
      const bestTime = best.updatedAt || 0;
      const candidateTime = candidate.updatedAt || 0;
      return candidateTime > bestTime ? candidate : best;
    }, null);

    set({
      state: chosen.state,
      aiColors: chosen.aiColors || [],
      aiDifficulty: chosen.aiDifficulty || AIDifficulty.MEDIUM,
      pendingMoves: [],
    });
    return true;
  },

  clearSavedGame: async () => {
    set({ state: null, pendingMoves: [] });
    try {
      await AsyncStorage.removeItem(SAVE_KEY);
    } catch (e) {
      console.warn('Failed to clear local save', e);
    }
    const user = getCurrentFirebaseUser();
    if (user) {
      deleteGameFromCloud(user.uid); // fire-and-forget
    }
  },
}));

export { getCurrentColor };
