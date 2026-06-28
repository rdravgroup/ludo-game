// server/server.js
//
// Run with: node server.js   (from inside /server)
// Listens on port 3001 by default. The Expo app's SocketClient.js should
// point SERVER_URL at this server's address — for physical devices use
// your computer's LAN IP, not "localhost".

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { customAlphabet } = require('nanoid');

const {
  PLAYER_ORDER,
  createInitialGameState,
  getCurrentColor,
  getLegalMoves,
  applyMove,
  advanceTurn,
  checkGameOver,
  rollDice,
} = require('./gameLogic');

const PORT = process.env.PORT || 3001;
// In production, set ALLOWED_ORIGIN to your app's actual origin(s) if you
// ever serve a web build; for native iOS/Android builds there's no
// browser origin to restrict, so '*' is the common default for this kind
// of game server. Comma-separate multiple origins if needed.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 5);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGIN === '*' ? '*' : ALLOWED_ORIGIN.split(',') },
});

app.get('/health', (req, res) => res.json({ ok: true, rooms: rooms.size }));

/**
 * In-memory room registry.
 * rooms: Map<roomCode, {
 *   code, hostSocketId, players: Map<socketId, { username, avatarId, color, ready }>,
 *   gameState: object | null, started: boolean
 * }>
 */
const rooms = new Map();

function serializePlayers(room) {
  return Array.from(room.players.entries()).map(([id, p]) => ({
    id,
    username: p.username,
    avatarId: p.avatarId,
    color: p.color,
    ready: p.ready,
  }));
}

function broadcastRoomUpdate(room) {
  io.to(room.code).emit('room:update', { players: serializePlayers(room) });
}

function assignColors(room) {
  const playerIds = Array.from(room.players.keys());
  playerIds.forEach((id, i) => {
    room.players.get(id).color = PLAYER_ORDER[i];
  });
}

function tryStartGame(room) {
  const players = Array.from(room.players.values());
  if (players.length < 2) return;
  if (!players.every((p) => p.ready)) return;

  assignColors(room);
  const activeColors = Array.from(room.players.values()).map((p) => p.color);
  room.gameState = createInitialGameState(activeColors, 'online');
  room.started = true;

  io.to(room.code).emit('game:start', { activeColors });
  io.to(room.code).emit('game:state', { state: room.gameState });
}

io.on('connection', (socket) => {
  socket.on('room:create', ({ username, avatarId }) => {
    const code = nanoid();
    const room = {
      code,
      hostSocketId: socket.id,
      players: new Map(),
      gameState: null,
      started: false,
    };
    room.players.set(socket.id, { username: username || 'Player', avatarId: avatarId || 0, color: null, ready: false });
    rooms.set(code, room);

    socket.join(code);
    socket.data.roomCode = code;

    socket.emit('room:created', { roomCode: code });
    broadcastRoomUpdate(room);
  });

  socket.on('room:join', ({ roomCode, username, avatarId }) => {
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('room:error', { message: `Room ${roomCode} not found.` });
      return;
    }
    if (room.started) {
      socket.emit('room:error', { message: 'This match has already started.' });
      return;
    }
    if (room.players.size >= 4) {
      socket.emit('room:error', { message: 'Room is full (4 players max).' });
      return;
    }

    room.players.set(socket.id, { username: username || 'Player', avatarId: avatarId || 0, color: null, ready: false });
    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    broadcastRoomUpdate(room);
  });

  socket.on('room:ready', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;
    player.ready = true;

    broadcastRoomUpdate(room);
    tryStartGame(room);
  });

  socket.on('game:rollDice', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameState || room.gameState.status !== 'PLAYING') return;

    const currentColor = getCurrentColor(room.gameState);
    const player = room.players.get(socket.id);
    if (!player || player.color !== currentColor) return; // not your turn
    if (room.gameState.diceRolled) return;

    const value = rollDice();
    const consecutiveSixes = value === 6 ? room.gameState.consecutiveSixes + 1 : 0;
    room.gameState = { ...room.gameState, diceValue: value, diceRolled: true, consecutiveSixes };
    const moves = getLegalMoves(room.gameState, value);

    io.to(roomCode).emit('game:diceRolled', { value, moves, state: room.gameState });

    if (moves.length === 0) {
      setTimeout(() => {
        room.gameState = advanceTurn(room.gameState, false);
        io.to(roomCode).emit('game:state', { state: room.gameState });
      }, 600);
    }
  });

  socket.on('game:move', ({ roomCode, tokenId }) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameState || room.gameState.status !== 'PLAYING') return;

    const currentColor = getCurrentColor(room.gameState);
    const player = room.players.get(socket.id);
    if (!player || player.color !== currentColor) return;
    if (!room.gameState.diceRolled) return;

    const moves = getLegalMoves(room.gameState, room.gameState.diceValue);
    const move = moves.find((m) => m.tokenId === tokenId);
    if (!move) return; // illegal move attempt, ignore silently

    const { newState, result } = applyMove(room.gameState, move);
    const { isOver, winner } = checkGameOver(newState);

    room.gameState = isOver
      ? { ...newState, status: 'WON', winner }
      : advanceTurn(newState, result.extraTurn);

    io.to(roomCode).emit('game:moveApplied', { move, result, state: room.gameState, isOver, winner });
  });

  socket.on('chat:message', ({ roomCode, message }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    io.to(roomCode).emit('chat:message', {
      sender: player?.username || 'Player',
      color: player?.color,
      ...message,
      timestamp: Date.now(),
    });
  });

  socket.on('disconnect', () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    room.players.delete(socket.id);
    if (room.players.size === 0) {
      rooms.delete(roomCode);
    } else {
      broadcastRoomUpdate(room);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Ludo Royale server listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
