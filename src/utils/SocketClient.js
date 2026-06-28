// src/utils/SocketClient.js
import { io } from 'socket.io-client';

// ── SERVER URL CONFIGURATION ──────────────────────────────────────────
// Reads from .env (see .env.example). Falls back to localhost for local
// dev if nothing is set, which is convenient but means physical devices
// won't be able to connect until you either:
//   (a) set EXPO_PUBLIC_SERVER_URL to your machine's LAN IP, or
//   (b) deploy the server (see /server/README_DEPLOY.md) and set
//       EXPO_PUBLIC_SERVER_URL_PROD to that URL.
//
// EXPO_PUBLIC_ENV controls which one is used — set it to "production" in
// your EAS build profiles (see eas.json) so production builds always hit
// your deployed server rather than localhost.
const DEV_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3001';
const PROD_URL = process.env.EXPO_PUBLIC_SERVER_URL_PROD || DEV_URL;
const ENV = process.env.EXPO_PUBLIC_ENV || 'development';

export const SERVER_URL = ENV === 'production' ? PROD_URL : DEV_URL;

class SocketClientClass {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect(serverUrl = SERVER_URL) {
    if (this.socket?.connected) return this.socket;
    this.socket = io(serverUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // Deployed servers on free/low tiers (Render, Railway free plans)
      // can take several seconds to wake from a cold start — a short
      // timeout makes the lobby screen report "couldn't reach server"
      // before the user has actually given it a fair chance to wake up.
      timeout: 10000,
    });
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }

  emit(event, payload) {
    if (!this.socket) return;
    this.socket.emit(event, payload);
  }

  // --- Convenience wrappers for game-specific events ---

  createRoom({ username, avatarId }) {
    this.emit('room:create', { username, avatarId });
  }

  joinRoom({ roomCode, username, avatarId }) {
    this.emit('room:join', { roomCode, username, avatarId });
  }

  setReady(roomCode) {
    this.emit('room:ready', { roomCode });
  }

  rollDice(roomCode) {
    this.emit('game:rollDice', { roomCode });
  }

  makeMove(roomCode, tokenId) {
    this.emit('game:move', { roomCode, tokenId });
  }

  sendChat(roomCode, message) {
    this.emit('chat:message', { roomCode, message });
  }
}

export const SocketClient = new SocketClientClass();
