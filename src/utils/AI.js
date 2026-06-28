// src/utils/AI.js
//
// Three real difficulty tiers, not just relabeled copies of the same logic:
//
//   EASY   — mostly random move selection. It WILL occasionally take an
//            obvious capture (humans expect *some* competence), but most
//            of the time it just picks a legal move at random. Genuinely
//            beatable by a beginner.
//   MEDIUM — the original greedy heuristic: always takes captures, prefers
//            reaching home, escapes danger, advances the lead token. No
//            lookahead, so it can walk into a counter-capture next turn.
//   HARD   — same heuristic as MEDIUM, plus 1-ply lookahead: for each
//            candidate move, it simulates the resulting position and
//            checks whether ANY opponent token could capture the token
//            that just moved on their very next turn (across all 6 dice
//            values), and penalizes moves that expose it that way. It also
//            weighs forming/maintaining a block (2 of its own tokens on
//            one cell) more heavily, which MEDIUM ignores.

import {
  getLegalMoves,
  getAbsolutePathIndex,
  isSafeAbsoluteIndex,
  applyMove,
  TokenState,
} from './GameLogic';
import { TOTAL_STEPS_TO_HOME } from './BoardConfig';

export const AIDifficulty = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
};

/**
 * Decide which legal move the AI should make for the given difficulty.
 */
export function chooseAIMove(state, diceValue, difficulty = AIDifficulty.MEDIUM) {
  const moves = getLegalMoves(state, diceValue);
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0];

  if (difficulty === AIDifficulty.EASY) return chooseEasyMove(state, moves);

  const color = state.activeColors[state.currentTurnIndex];
  const scored = moves.map((move) => ({
    move,
    score: scoreMove(state, color, move, difficulty),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored[0].move;
}

// ── EASY ────────────────────────────────────────────────────────────
function chooseEasyMove(state, moves) {
  const color = state.activeColors[state.currentTurnIndex];

  // 25% of the time, take an "obvious" move if one exists (a capture or a
  // move that reaches home) — enough competence to not feel broken, but
  // mostly random so it's genuinely easy to beat.
  if (Math.random() < 0.25) {
    const obvious = moves.find(
      (m) => wouldCapture(state, color, m) || m.toRelativeStep >= TOTAL_STEPS_TO_HOME - 1
    );
    if (obvious) return obvious;
  }

  return moves[Math.floor(Math.random() * moves.length)];
}

// ── MEDIUM + HARD shared scoring ──────────────────────────────────────
function scoreMove(state, color, move, difficulty) {
  let score = 0;
  const token = state.tokens[color].find((t) => t.id === move.tokenId);

  // 1. Captures are king.
  if (wouldCapture(state, color, move)) score += 100;

  // 2. Reaching home outright.
  if (move.toRelativeStep >= TOTAL_STEPS_TO_HOME - 1) score += 80;

  // 3. Bringing a new token into play if board presence is low.
  if (move.type === 'ENTER') {
    const activeCount = state.tokens[color].filter(
      (t) => t.state === TokenState.ACTIVE
    ).length;
    score += activeCount === 0 ? 40 : 15;
  }

  // 4. Landing on a safe cell is good, especially if currently exposed.
  if (move.toRelativeStep <= 50) {
    const absIndex = getAbsolutePathIndex(color, move.toRelativeStep);
    if (absIndex !== null && isSafeAbsoluteIndex(absIndex)) score += 25;
  }

  // 5. Prefer moving tokens that are currently in danger.
  if (token.state === TokenState.ACTIVE && isInDanger(state, color, token)) {
    score += 30;
  }

  // 6. Slight preference for advancing the lead token.
  score += token.relativeStep * 0.5;

  if (difficulty === AIDifficulty.HARD) {
    // 7. Forming/maintaining a block (2+ own tokens on one cell) is a
    //    strong defensive structure — HARD values this, MEDIUM doesn't.
    if (formsBlock(state, color, move)) score += 35;

    // 8. Defensive lookahead: if this move leaves the moved token exposed
    //    to being captured by ANY opponent on their immediate next turn
    //    (checked across all 6 possible dice rolls), penalize heavily.
    // This is what separates HARD from MEDIUM — MEDIUM is "greedy now",
    // HARD is "greedy now, but not if it gets punished immediately after".
    const exposurePenalty = computeNextTurnExposure(state, color, move);
    score -= exposurePenalty;

    // 9. Offensive lookahead: reward moves that put this token within
    //    striking range of an opponent for MY next turn — i.e. set up a
    //    capture a turn in advance rather than only ever taking captures
    //    that are available right now. Mirrors #8 in the opposite
    //    direction, so HARD compounds an edge both defensively and
    //    offensively instead of relying on a single signal.
    const setupBonus = computeNextTurnSetup(state, color, move);
    score += setupBonus;
  }

  return score;
}

function wouldCapture(state, color, move) {
  if (move.toRelativeStep > 50) return false;
  const absIndex = getAbsolutePathIndex(color, move.toRelativeStep);
  if (absIndex === null || isSafeAbsoluteIndex(absIndex)) return false;

  return state.activeColors.some((otherColor) => {
    if (otherColor === color) return false;
    return state.tokens[otherColor].some((t) => {
      if (t.state !== TokenState.ACTIVE || t.relativeStep > 50) return false;
      return getAbsolutePathIndex(otherColor, t.relativeStep) === absIndex;
    });
  });
}

function isInDanger(state, color, token) {
  if (token.relativeStep > 50) return false;
  const myAbs = getAbsolutePathIndex(color, token.relativeStep);
  if (isSafeAbsoluteIndex(myAbs)) return false;

  return state.activeColors.some((otherColor) => {
    if (otherColor === color) return false;
    return state.tokens[otherColor].some((t) => {
      if (t.state !== TokenState.ACTIVE || t.relativeStep > 50) return false;
      const otherAbs = getAbsolutePathIndex(otherColor, t.relativeStep);
      const distance = (myAbs - otherAbs + 52) % 52;
      return distance >= 1 && distance <= 6;
    });
  });
}

function formsBlock(state, color, move) {
  if (move.toRelativeStep > 50) return false;
  const absIndex = getAbsolutePathIndex(color, move.toRelativeStep);
  if (absIndex === null) return false;

  // Count how many of MY OTHER tokens already sit on that destination cell.
  const ownOccupants = state.tokens[color].filter((t) => {
    if (t.id === move.tokenId || t.state !== TokenState.ACTIVE || t.relativeStep > 50) return false;
    return getAbsolutePathIndex(color, t.relativeStep) === absIndex;
  });
  return ownOccupants.length >= 1; // moving onto a cell with 1+ of my own tokens forms a block of 2+
}

/**
 * 1-ply lookahead: simulate making `move`, then for each opponent color,
 * check every possible dice value (1-6) and see if any of THEIR legal
 * moves would capture the token we just moved. Returns a penalty score
 * proportional to how many distinct dice values would let an opponent
 * punish us (more exposure = higher penalty), capped to keep scoring sane.
 */
function computeNextTurnExposure(state, color, move) {
  if (move.toRelativeStep > 50) return 0; // safe in home stretch, can't be captured there

  const { newState } = applyMove(
    { ...state, diceValue: state.diceValue, diceRolled: true },
    move
  );

  const movedToken = newState.tokens[color].find((t) => t.id === move.tokenId);
  if (!movedToken || movedToken.relativeStep > 50) return 0;

  const myAbs = getAbsolutePathIndex(color, movedToken.relativeStep);
  if (isSafeAbsoluteIndex(myAbs)) return 0;

  let exposedDiceCount = 0;
  const otherColors = newState.activeColors.filter((c) => c !== color);

  for (const opponentColor of otherColors) {
    const opponentState = {
      ...newState,
      currentTurnIndex: newState.activeColors.indexOf(opponentColor),
    };
    for (let die = 1; die <= 6; die++) {
      const opponentMoves = getLegalMoves(opponentState, die);
      const canCapture = opponentMoves.some((m) => {
        if (m.toRelativeStep > 50) return false;
        const oppAbs = getAbsolutePathIndex(opponentColor, m.toRelativeStep);
        return oppAbs === myAbs;
      });
      if (canCapture) {
        exposedDiceCount++;
        break; // one exposing die value from this opponent is enough to count them
      }
    }
  }

  // Each opponent who has at least one dice value that captures us adds
  // meaningful risk. Weighted high enough to outweigh the "advance the
  // lead token" bonus (token.relativeStep * 0.5, max ~28 for a token at
  // step 56) in the common case of a single exposing opponent — getting
  // captured erases far more progress than one move gains, so the penalty
  // should dominate that heuristic, not just nudge it.
  return exposedDiceCount * 30;
}

/**
 * Offensive mirror of computeNextTurnExposure: after simulating `move`,
 * check whether ANY of this color's own tokens (not just the one that
 * just moved) would be within capturing range of an opponent token on
 * this color's own next turn, across all 6 possible dice values. Returns
 * a bonus proportional to how many dice values would let us capture.
 */
function computeNextTurnSetup(state, color, move) {
  const { newState } = applyMove(
    { ...state, diceValue: state.diceValue, diceRolled: true },
    move
  );

  let settingUpDiceCount = 0;
  // It's still conceptually "our" turn in this simulated state (we just
  // haven't advanced turn yet), so getLegalMoves with currentTurnIndex
  // unchanged correctly evaluates moves for `color`.
  const myTurnState = {
    ...newState,
    currentTurnIndex: newState.activeColors.indexOf(color),
  };

  for (let die = 1; die <= 6; die++) {
    const myMoves = getLegalMoves(myTurnState, die);
    const canCaptureNext = myMoves.some((m) => wouldCapture(myTurnState, color, m));
    if (canCaptureNext) settingUpDiceCount++;
  }

  // Weighted lower than the defensive penalty — avoiding a capture is
  // more valuable than merely threatening one (an opponent gets a turn
  // to react first), but it's still a meaningful tie-breaker between
  // otherwise-similar moves, which is where this matters most.
  return settingUpDiceCount * 8;
}

/** Small delay so the AI doesn't feel instant/robotic. */
export function aiThinkingDelay(difficulty = AIDifficulty.MEDIUM) {
  // HARD "thinks longer" — partly flavor, partly because it's doing more
  // work (lookahead across all opponents/dice values per candidate move).
  if (difficulty === AIDifficulty.HARD) return 900 + Math.random() * 700;
  if (difficulty === AIDifficulty.EASY) return 400 + Math.random() * 400;
  return 600 + Math.random() * 600;
}
