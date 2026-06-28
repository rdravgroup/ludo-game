// server/gameLogic.js
//
// This is a CommonJS port of /src/utils/GameLogic.js + BoardConfig.js,
// kept in sync intentionally so the server can be the authoritative
// source of truth for online matches (never trust the client for game
// rules in a real-time multiplayer game).
//
// If you change the rules on the client, mirror the change here too.

const PLAYER_ORDER = ['RED', 'GREEN', 'YELLOW', 'BLUE'];

const MAIN_PATH = [
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
  [7, 0], [8, 0],
  [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  [14, 7], [14, 8],
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
  [7, 14], [6, 14],
  [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  [0, 7], [0, 6],
];

const START_INDEX = { RED: 0, GREEN: 13, YELLOW: 26, BLUE: 39 };
const SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];
const TOKENS_PER_PLAYER = 4;
const DICE_SIX = 6;
const MAX_CONSECUTIVE_SIXES = 3;
const TOTAL_STEPS_TO_HOME = 57;
const MAIN_PATH_LENGTH = MAIN_PATH.length;

const TokenState = { YARD: 'YARD', ACTIVE: 'ACTIVE', HOME: 'HOME' };

function createToken(color, tokenIndex) {
  return { id: `${color}_${tokenIndex}`, color, tokenIndex, state: TokenState.YARD, relativeStep: -1 };
}

function createInitialGameState(activeColors, mode = 'online') {
  const tokens = {};
  activeColors.forEach((color) => {
    tokens[color] = Array.from({ length: TOKENS_PER_PLAYER }, (_, i) => createToken(color, i));
  });
  return {
    mode,
    activeColors,
    tokens,
    currentTurnIndex: 0,
    diceValue: null,
    diceRolled: false,
    consecutiveSixes: 0,
    status: 'PLAYING',
    winner: null,
    lastCapture: null,
    moveLog: [],
  };
}

function getCurrentColor(state) {
  return state.activeColors[state.currentTurnIndex];
}

function getAbsolutePathIndex(color, relativeStep) {
  if (relativeStep < 0 || relativeStep > 50) return null;
  return (START_INDEX[color] + relativeStep) % MAIN_PATH_LENGTH;
}

function isSafeAbsoluteIndex(absIndex) {
  return SAFE_INDICES.includes(absIndex);
}

function tokensAtSameMainPathCell(state, color, relativeStep) {
  const absIndex = getAbsolutePathIndex(color, relativeStep);
  if (absIndex === null) return [];
  const result = [];
  state.activeColors.forEach((otherColor) => {
    state.tokens[otherColor].forEach((token) => {
      if (token.state !== TokenState.ACTIVE || token.relativeStep > 50) return;
      if (getAbsolutePathIndex(otherColor, token.relativeStep) === absIndex) result.push(token);
    });
  });
  return result;
}

function getLegalMoves(state, diceValue) {
  const color = getCurrentColor(state);
  const moves = [];

  state.tokens[color].forEach((token) => {
    if (token.state === TokenState.YARD) {
      if (diceValue === DICE_SIX) {
        const occupants = tokensAtSameMainPathCell(state, color, 0);
        const opponentBlock = occupants.filter((t) => t.color !== color).length >= 2;
        if (!opponentBlock) moves.push({ tokenId: token.id, type: 'ENTER', toRelativeStep: 0 });
      }
      return;
    }
    if (token.state === TokenState.ACTIVE) {
      const target = token.relativeStep + diceValue;
      if (target > TOTAL_STEPS_TO_HOME - 1) return;
      if (target <= 50) {
        const occupants = tokensAtSameMainPathCell(state, color, target);
        const opponentBlock = occupants.filter((t) => t.color !== color).length >= 2;
        if (opponentBlock) return;
      }
      moves.push({ tokenId: token.id, type: 'MOVE', toRelativeStep: target });
    }
  });

  return moves;
}

function cloneTokens(tokens) {
  const clone = {};
  Object.keys(tokens).forEach((color) => {
    clone[color] = tokens[color].map((t) => ({ ...t }));
  });
  return clone;
}

function applyMove(state, move) {
  const color = getCurrentColor(state);
  const newTokens = cloneTokens(state.tokens);
  const token = newTokens[color].find((t) => t.id === move.tokenId);

  const result = { capture: null, tokenReachedHome: false, extraTurn: false };

  if (move.type === 'ENTER') {
    token.state = TokenState.ACTIVE;
    token.relativeStep = 0;
  } else {
    token.relativeStep = move.toRelativeStep;
    if (token.relativeStep >= TOTAL_STEPS_TO_HOME - 1) {
      token.relativeStep = TOTAL_STEPS_TO_HOME - 1;
      token.state = TokenState.HOME;
      result.tokenReachedHome = true;
    }
  }

  if (token.state === TokenState.ACTIVE && token.relativeStep <= 50) {
    const absIndex = getAbsolutePathIndex(color, token.relativeStep);
    if (!isSafeAbsoluteIndex(absIndex)) {
      state.activeColors.forEach((otherColor) => {
        if (otherColor === color) return;
        newTokens[otherColor].forEach((otherToken) => {
          if (otherToken.state !== TokenState.ACTIVE || otherToken.relativeStep > 50) return;
          if (getAbsolutePathIndex(otherColor, otherToken.relativeStep) === absIndex) {
            otherToken.state = TokenState.YARD;
            otherToken.relativeStep = -1;
            result.capture = {
              capturedColor: otherColor,
              capturedTokenId: otherToken.id,
              byColor: color,
              byTokenId: token.id,
            };
          }
        });
      });
    }
  }

  const diceWasSix = state.diceValue === DICE_SIX;
  result.extraTurn = diceWasSix || !!result.capture || result.tokenReachedHome;

  const newState = {
    ...state,
    tokens: newTokens,
    moveLog: [...state.moveLog, { color, tokenId: token.id, move, capture: result.capture }],
    lastCapture: result.capture,
  };

  return { newState, result };
}

function hasColorWon(state, color) {
  return state.tokens[color].every((t) => t.state === TokenState.HOME);
}

function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

function nextPlayerIndex(state) {
  const n = state.activeColors.length;
  let idx = state.currentTurnIndex;
  for (let i = 1; i <= n; i++) {
    const candidate = (idx + i) % n;
    if (!hasColorWon(state, state.activeColors[candidate])) return candidate;
  }
  return idx;
}

function advanceTurn(state, grantedExtraTurn) {
  let nextIndex = state.currentTurnIndex;
  let consecutiveSixes = state.consecutiveSixes;

  if (!grantedExtraTurn) {
    consecutiveSixes = 0;
    nextIndex = nextPlayerIndex(state);
  }
  if (grantedExtraTurn && consecutiveSixes >= MAX_CONSECUTIVE_SIXES) {
    consecutiveSixes = 0;
    nextIndex = nextPlayerIndex(state);
  }

  return { ...state, currentTurnIndex: nextIndex, diceValue: null, diceRolled: false, consecutiveSixes };
}

function checkGameOver(state) {
  const remaining = state.activeColors.filter((c) => !hasColorWon(state, c));
  if (remaining.length <= 1 && state.activeColors.length > 1) {
    const winner = state.activeColors.find((c) => hasColorWon(state, c));
    return { isOver: true, winner: winner || null };
  }
  return { isOver: false, winner: null };
}

module.exports = {
  PLAYER_ORDER,
  TokenState,
  createInitialGameState,
  getCurrentColor,
  getLegalMoves,
  applyMove,
  advanceTurn,
  checkGameOver,
  rollDice,
  hasColorWon,
};
