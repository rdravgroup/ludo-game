// server/test_integration.js
// Quick smoke test: simulates two players connecting, creating/joining a
// room, readying up, and playing forced turns until we've exercised
// dice roll -> moves -> turn advance at least a few times.
const { io } = require('socket.io-client');

const URL = 'http://localhost:3001';
let roomCode = null;
let p1Color = null;
let p2Color = null;
let turnsPlayed = 0;
const MAX_TURNS = 8;

const c1 = io(URL, { transports: ['websocket'] });
const c2 = io(URL, { transports: ['websocket'] });

function log(who, ...args) {
  console.log(`[${who}]`, ...args);
}

c1.on('connect', () => {
  log('P1', 'connected', c1.id);
  c1.emit('room:create', { username: 'Alice', avatarId: 0 });
});

c1.on('room:created', ({ roomCode: code }) => {
  roomCode = code;
  log('P1', 'room created', code);
  // small delay then have P2 join
  setTimeout(() => {
    c2.emit('room:join', { roomCode: code, username: 'Bob', avatarId: 1 });
  }, 200);
});

c1.on('room:update', ({ players }) => {
  log('P1', 'room update', JSON.stringify(players.map((p) => p.username + ':' + p.ready)));
});

c2.on('connect', () => log('P2', 'connected', c2.id));

c2.on('room:update', ({ players }) => {
  log('P2', 'room update', JSON.stringify(players.map((p) => p.username + ':' + p.ready)));
  if (players.length === 2 && !players.every((p) => p.ready)) {
    // both joined, ready up both
    setTimeout(() => {
      c1.emit('room:ready', { roomCode });
      c2.emit('room:ready', { roomCode });
    }, 200);
  }
});

c1.on('room:error', (e) => log('P1', 'ERROR', e));
c2.on('room:error', (e) => log('P2', 'ERROR', e));

function setupGameHandlers(client, who) {
  client.on('game:start', ({ activeColors }) => {
    log(who, 'game:start', activeColors);
  });

  client.on('game:state', ({ state }) => {
    if (who === 'P1') p1Color = findMyColor(state, 'Alice');
    if (who === 'P2') p2Color = findMyColor(state, 'Bob');
    maybeTakeTurn(state);
  });

  client.on('game:diceRolled', ({ value, moves, state }) => {
    log(who, 'dice rolled:', value, 'legal moves:', moves.length);
    const myColor = who === 'P1' ? p1Color : p2Color;
    const currentColor = state.activeColors[state.currentTurnIndex];
    if (myColor === currentColor && moves.length > 0) {
      client.emit('game:move', { roomCode, tokenId: moves[0].tokenId });
    }
  });

  client.on('game:moveApplied', ({ move, result, state, isOver, winner }) => {
    turnsPlayed += 1;
    log(who, `move applied: ${move.tokenId} -> step ${move.toRelativeStep}`, result.capture ? '(CAPTURE!)' : '');
    if (isOver) {
      log(who, '🏆 GAME OVER. Winner:', winner);
      finishTest(true);
      return;
    }
    if (turnsPlayed >= MAX_TURNS) {
      log(who, `Reached ${MAX_TURNS} turns without full game — logic appears functional.`);
      finishTest(true);
      return;
    }
    maybeTakeTurn(state);
  });
}

function findMyColor(state, username) {
  // crude lookup isn't available from state alone; colors are assigned in
  // join order (RED, GREEN, ...). Alice joins/creates first -> RED, Bob -> GREEN.
  return username === 'Alice' ? 'RED' : 'GREEN';
}

function maybeTakeTurn(state) {
  if (!roomCode || !state || state.status !== 'PLAYING') return;
  const currentColor = state.activeColors[state.currentTurnIndex];
  const actingClient = currentColor === p1Color ? c1 : currentColor === p2Color ? c2 : null;
  if (!actingClient) return;
  if (state.diceRolled) return;
  setTimeout(() => actingClient.emit('game:rollDice', { roomCode }), 150);
}

setupGameHandlers(c1, 'P1');
setupGameHandlers(c2, 'P2');

function finishTest(success) {
  c1.disconnect();
  c2.disconnect();
  console.log(success ? '\n✅ INTEGRATION TEST PASSED\n' : '\n❌ INTEGRATION TEST FAILED\n');
  process.exit(success ? 0 : 1);
}

setTimeout(() => {
  console.log('\n⏰ Timeout — did not complete expected turns.');
  finishTest(false);
}, 15000);
