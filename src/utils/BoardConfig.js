// src/utils/BoardConfig.js
// Standard 15x15 Ludo board, grid coordinates (col, row), 0-indexed.
// This is the single source of truth for board geometry used by both
// the game logic (GameLogic.js) and the rendering layer (Board.js).

export const GRID_SIZE = 15;

export const PLAYER_COLORS = {
  RED: 'RED',
  GREEN: 'GREEN',
  YELLOW: 'YELLOW',
  BLUE: 'BLUE',
};

export const PLAYER_ORDER = [
  PLAYER_COLORS.RED,
  PLAYER_COLORS.GREEN,
  PLAYER_COLORS.YELLOW,
  PLAYER_COLORS.BLUE,
];

export const PLAYER_THEME = {
  RED: { primary: '#E53E3E', light: '#FEB2B2', dark: '#9B2C2C' },
  GREEN: { primary: '#38A169', light: '#9AE6B4', dark: '#22543D' },
  YELLOW: { primary: '#D69E2E', light: '#FAF089', dark: '#975A16' },
  BLUE: { primary: '#3182CE', light: '#90CDF4', dark: '#2A4365' },
};

// The 52-cell outer track, expressed as grid (col,row) coordinates,
// walked clockwise starting from the cell just outside RED's home entry.
// This path is identical for all players; each player just starts at a
// different OFFSET into it (their "start index").
export const MAIN_PATH = [
  // --- Bottom-left arm going up (RED start column) ---
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

// Index into MAIN_PATH where each color enters the board from their yard.
export const START_INDEX = {
  RED: 0,
  GREEN: 13,
  YELLOW: 26,
  BLUE: 39,
};

// Each color turns off the main path onto its own colored "home stretch"
// (5 cells) after completing one full lap, i.e. when it reaches the cell
// 51 steps after its own start index (one before returning to its start).
// We model this as: turn index = (START_INDEX[color] + 51) % 52
export const TURN_OFFSET = 50; // steps from start index before entering home column

// Home stretch (final 5 cells + center) per color, grid coordinates.
export const HOME_STRETCH = {
  RED: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  GREEN: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  YELLOW: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
  BLUE: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
};

export const HOME_CENTER = [7, 7];

// Safe cells (star cells + all start cells) — tokens here cannot be captured.
export const SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

// Yard (base) positions for each color's 4 tokens, grid coordinates.
export const YARD_POSITIONS = {
  RED: [[1.5, 1.5], [3.5, 1.5], [1.5, 3.5], [3.5, 3.5]],
  GREEN: [[10.5, 1.5], [12.5, 1.5], [10.5, 3.5], [12.5, 3.5]],
  YELLOW: [[10.5, 10.5], [12.5, 10.5], [10.5, 12.5], [12.5, 12.5]],
  BLUE: [[1.5, 10.5], [3.5, 10.5], [1.5, 12.5], [3.5, 12.5]],
};

// Total path length a token travels from entering the board to reaching
// the center: 51 main-path steps (relative) + 5 home-stretch + 1 center.
export const TOTAL_STEPS_TO_HOME = 57;

export const TOKENS_PER_PLAYER = 4;
export const DICE_SIX = 6;
export const MAX_CONSECUTIVE_SIXES = 3;
