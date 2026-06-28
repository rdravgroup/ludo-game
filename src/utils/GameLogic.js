// src/utils/GameLogic.js
// Pure, framework-free Ludo rules engine.
// Token "position" model (per token, per color):
//   state: 'YARD'   -> not yet on board. relativeStep = -1
//   state: 'ACTIVE' -> on main path or home stretch. relativeStep = 0..56
//                       (0..50 = main path, 51..55 = home stretch, 56 = center/home)
//   state: 'HOME'   -> finished. relativeStep = 56
//
// relativeStep is *relative to that color's own start*, which makes
// "has this token passed cell X" trivial regardless of color.

import {
  PLAYER_ORDER,
  START_INDEX,
  MAIN_PATH,
  SAFE_INDICES,
  TOKENS_PER_PLAYER,
  DICE_SIX,
  MAX_CONSECUTIVE_SIXES,
  TOTAL_STEPS_TO_HOME,
} from './BoardConfig';

export const TokenState = {
  YARD: 'YARD',
  ACTIVE: 'ACTIVE',
  HOME: 'HOME',
};

const MAIN_PATH_LENGTH = MAIN_PATH.length; // 52

/** Create a fresh token for a color/index pair. */
export function createToken(color, tokenIndex) {
  return {
    id: `${color}_${tokenIndex}`,
    color,
    tokenIndex,
    state: TokenState.YARD,
    relativeStep: -1,
  };
}

/** Build the initial game state for the given list of active colors. */
export function createInitialGameState(activeColors, mode = 'local') {
  const tokens = {};
  activeColors.forEach((color) => {
    tokens[color] = Array.from({ length: TOKENS_PER_PLAYER }, (_, i) =>
      createToken(color, i)
    );
  });

  return {
    mode, // 'local' | 'ai' | 'online'
    activeColors,
    tokens,
    currentTurnIndex: 0, // index into activeColors
    diceValue: null,
    diceRolled: false,
    consecutiveSixes: 0,
    status: 'PLAYING', // 'PLAYING' | 'WON' | 'DRAW' | 'PAUSED'
    winner: null,
    turnOrderHistory: [],
    lastCapture: null, // { capturedColor, capturedTokenId, byColor, byTokenId } for animation hooks
    moveLog: [],
  };
}

export function getCurrentColor(state) {
  return state.activeColors[state.currentTurnIndex];
}

/** Convert a token's relativeStep into absolute board grid coords (for rendering use elsewhere). */
export function getAbsolutePathIndex(color, relativeStep) {
  // relativeStep 0..50 maps onto the shared 52-cell ring, offset by this
  // color's start index. Step 51..55 are this color's own home stretch
  // (handled separately by the renderer via HOME_STRETCH[color]).
  if (relativeStep < 0 || relativeStep > 50) return null;
  return (START_INDEX[color] + relativeStep) % MAIN_PATH_LENGTH;
}

/** Is the absolute main-path index a safe cell? */
export function isSafeAbsoluteIndex(absIndex) {
  return SAFE_INDICES.includes(absIndex);
}

/** All tokens (across all colors) sitting at the same absolute main-path cell as (color, relativeStep). */
function tokensAtSameMainPathCell(state, color, relativeStep) {
  const absIndex = getAbsolutePathIndex(color, relativeStep);
  if (absIndex === null) return [];

  const result = [];
  state.activeColors.forEach((otherColor) => {
    state.tokens[otherColor].forEach((token) => {
      if (token.state !== TokenState.ACTIVE) return;
      if (token.relativeStep > 50) return; // already in home stretch, not on shared ring
      const otherAbs = getAbsolutePathIndex(otherColor, token.relativeStep);
      if (otherAbs === absIndex) result.push(token);
    });
  });
  return result;
}

/**
 * Determine all legal moves for the current player given a dice value.
 * Returns an array of { tokenId, type: 'ENTER'|'MOVE', toRelativeStep }.
 */
export function getLegalMoves(state, diceValue) {
  const color = getCurrentColor(state);
  const moves = [];

  state.tokens[color].forEach((token) => {
    if (token.state === TokenState.YARD) {
      if (diceValue === DICE_SIX) {
        // Entering requires a 6, and the entry cell must not be blocked
        // by two-or-more of the player's OWN tokens forming a defensive block
        // is allowed in this variant (own stacking is fine); we only block
        // entry if an opponent has a "double block" (two tokens) sitting there.
        const occupants = tokensAtSameMainPathCell(state, color, 0);
        const opponentBlock =
          occupants.filter((t) => t.color !== color).length >= 2;
        if (!opponentBlock) {
          moves.push({ tokenId: token.id, type: 'ENTER', toRelativeStep: 0 });
        }
      }
      return;
    }

    if (token.state === TokenState.ACTIVE) {
      const target = token.relativeStep + diceValue;
      if (target > TOTAL_STEPS_TO_HOME - 1) return; // overshoots home, illegal
      // Check for an opponent block (2+ opponent tokens) anywhere along
      // the path between current and target on the shared ring — standard
      // simplified rule: only the destination cell needs checking for blocks.
      if (target <= 50) {
        const occupants = tokensAtSameMainPathCell(state, color, target);
        const opponentBlock =
          occupants.filter((t) => t.color !== color).length >= 2;
        if (opponentBlock) return;
      }
      moves.push({ tokenId: token.id, type: 'MOVE', toRelativeStep: target });
    }
  });

  return moves;
}

/**
 * Apply a chosen move to the state. Returns a NEW state object (immutable style)
 * plus metadata describing what happened (capture, home entry, etc.) for the UI
 * to animate.
 */
export function applyMove(state, move) {
  const color = getCurrentColor(state);
  const newTokens = cloneTokens(state.tokens);
  const token = newTokens[color].find((t) => t.id === move.tokenId);

  const result = {
    capture: null,
    tokenReachedHome: false,
    extraTurn: false,
  };

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

  // Capture check: only relevant if token landed on the shared ring (<=50)
  // and that cell is not a safe cell.
  if (token.state === TokenState.ACTIVE && token.relativeStep <= 50) {
    const absIndex = getAbsolutePathIndex(color, token.relativeStep);
    if (!isSafeAbsoluteIndex(absIndex)) {
      state.activeColors.forEach((otherColor) => {
        if (otherColor === color) return;
        newTokens[otherColor].forEach((otherToken) => {
          if (otherToken.state !== TokenState.ACTIVE) return;
          if (otherToken.relativeStep > 50) return;
          const otherAbs = getAbsolutePathIndex(
            otherColor,
            otherToken.relativeStep
          );
          if (otherAbs === absIndex) {
            // Capture! Send opponent token back to yard.
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

  // Bonus turn rules: rolling a 6, capturing, or reaching home all grant another roll.
  const diceWasSix = state.diceValue === DICE_SIX;
  result.extraTurn = diceWasSix || !!result.capture || result.tokenReachedHome;

  const newState = {
    ...state,
    tokens: newTokens,
    moveLog: [
      ...state.moveLog,
      { color, tokenId: token.id, move, capture: result.capture },
    ],
    lastCapture: result.capture,
  };

  return { newState, result };
}

/** Has this color finished all 4 tokens? */
export function hasColorWon(state, color) {
  return state.tokens[color].every((t) => t.state === TokenState.HOME);
}

/** Roll a single fair die 1-6. */
export function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Advance to the next player's turn, handling consecutive-six forfeiture
 * and skipping eliminated/finished players. Returns new state.
 */
export function advanceTurn(state, grantedExtraTurn) {
  let nextIndex = state.currentTurnIndex;
  let consecutiveSixes = state.consecutiveSixes;

  if (!grantedExtraTurn) {
    consecutiveSixes = 0;
    nextIndex = nextPlayerIndex(state);
  }
  // If extra turn granted but it was their 3rd consecutive six, forfeit anyway.
  if (grantedExtraTurn && consecutiveSixes >= MAX_CONSECUTIVE_SIXES) {
    consecutiveSixes = 0;
    nextIndex = nextPlayerIndex(state);
  }

  return {
    ...state,
    currentTurnIndex: nextIndex,
    diceValue: null,
    diceRolled: false,
    consecutiveSixes,
  };
}

function nextPlayerIndex(state) {
  const n = state.activeColors.length;
  let idx = state.currentTurnIndex;
  for (let i = 1; i <= n; i++) {
    const candidate = (idx + i) % n;
    const candidateColor = state.activeColors[candidate];
    if (!hasColorWon(state, candidateColor)) return candidate;
  }
  return idx;
}

function cloneTokens(tokens) {
  const clone = {};
  Object.keys(tokens).forEach((color) => {
    clone[color] = tokens[color].map((t) => ({ ...t }));
  });
  return clone;
}

/** Check overall game-over condition: all but one color finished. */
export function checkGameOver(state) {
  const remaining = state.activeColors.filter((c) => !hasColorWon(state, c));
  if (remaining.length <= 1 && state.activeColors.length > 1) {
    const winner = state.activeColors.find((c) => hasColorWon(state, c));
    return { isOver: true, winner: winner || null };
  }
  return { isOver: false, winner: null };
}
