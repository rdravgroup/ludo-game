// /home/claude/logic-test/test.mjs
import {
  createInitialGameState,
  getCurrentColor,
  getLegalMoves,
  applyMove,
  advanceTurn,
  checkGameOver,
  rollDice,
  TokenState,
} from '../src/utils/GameLogic.js';
import { chooseAIMove } from '../src/utils/AI.js';

function runFullRandomGame(activeColors, maxTurns = 5000) {
  let state = createInitialGameState(activeColors, 'local');
  let turnCount = 0;
  let totalCaptures = 0;
  let totalHomeEntries = 0;

  while (turnCount < maxTurns) {
    turnCount++;
    const value = rollDice();
    const stateWithRoll = {
      ...state,
      diceValue: value,
      diceRolled: true,
      consecutiveSixes: value === 6 ? state.consecutiveSixes + 1 : 0,
    };
    const moves = getLegalMoves(stateWithRoll, value);

    if (moves.length === 0) {
      state = advanceTurn(stateWithRoll, false);
      continue;
    }

    const move = chooseAIMove(stateWithRoll, value);
    if (!move) throw new Error('chooseAIMove returned null despite legal moves existing');

    const { newState, result } = applyMove(stateWithRoll, move);
    if (result.capture) totalCaptures++;
    if (result.tokenReachedHome) totalHomeEntries++;

    const { isOver, winner } = checkGameOver(newState);
    if (isOver) {
      return {
        completed: true,
        winner,
        turnCount,
        totalCaptures,
        totalHomeEntries,
      };
    }

    state = advanceTurn(newState, result.extraTurn);
  }

  return { completed: false, turnCount, totalCaptures, totalHomeEntries };
}

function validateInvariants(activeColors, trials = 30) {
  for (let t = 0; t < trials; t++) {
    let state = createInitialGameState(activeColors, 'local');
    for (let i = 0; i < 300; i++) {
      const color = getCurrentColor(state);
      const value = rollDice();
      const stateWithRoll = { ...state, diceValue: value, diceRolled: true };
      const moves = getLegalMoves(stateWithRoll, value);

      // Invariant: every proposed move's tokenId must belong to the current color.
      moves.forEach((m) => {
        const belongs = state.tokens[color].some((tok) => tok.id === m.tokenId);
        if (!belongs) throw new Error(`Move ${m.tokenId} does not belong to current color ${color}`);
      });

      if (moves.length === 0) {
        state = advanceTurn(stateWithRoll, false);
        continue;
      }
      const move = moves[Math.floor(Math.random() * moves.length)];
      const { newState, result } = applyMove(stateWithRoll, move);

      // Invariant: no token's relativeStep should ever exceed 56.
      activeColors.forEach((c) => {
        newState.tokens[c].forEach((tok) => {
          if (tok.relativeStep > 56) throw new Error(`Token ${tok.id} exceeded max step: ${tok.relativeStep}`);
          if (tok.state === 'HOME' && tok.relativeStep !== 56) throw new Error(`Token ${tok.id} marked HOME but step=${tok.relativeStep}`);
        });
      });

      // Invariant: total token count per color always 4.
      activeColors.forEach((c) => {
        if (newState.tokens[c].length !== 4) throw new Error(`Color ${c} lost tokens! count=${newState.tokens[c].length}`);
      });

      const { isOver } = checkGameOver(newState);
      if (isOver) break;
      state = advanceTurn(newState, result.extraTurn);
    }
  }
  return true;
}

console.log('=== Running invariant checks (2,3,4 players) ===');
['RED,GREEN', 'RED,GREEN,YELLOW', 'RED,GREEN,YELLOW,BLUE'].forEach((spec) => {
  const colors = spec.split(',');
  validateInvariants(colors, 25);
  console.log(`✅ Invariants hold for ${colors.length}-player games (25 trials x 300 turns)`);
});

console.log('\n=== Running full random games to completion ===');
['RED,GREEN', 'RED,GREEN,YELLOW', 'RED,GREEN,YELLOW,BLUE'].forEach((spec) => {
  const colors = spec.split(',');
  const results = [];
  for (let i = 0; i < 5; i++) {
    results.push(runFullRandomGame(colors));
  }
  const allCompleted = results.every((r) => r.completed);
  const avgTurns = (results.reduce((s, r) => s + r.turnCount, 0) / results.length).toFixed(0);
  const totalCaptures = results.reduce((s, r) => s + r.totalCaptures, 0);
  console.log(
    `${colors.length}-player: ${allCompleted ? '✅ all 5 games completed' : '⚠️ some games hit turn limit'} ` +
    `| avg turns: ${avgTurns} | total captures across 5 games: ${totalCaptures}`
  );
  if (!allCompleted) {
    throw new Error('A game failed to complete within turn limit — possible stuck state.');
  }
});

console.log('\n✅ ALL GAME LOGIC TESTS PASSED');
