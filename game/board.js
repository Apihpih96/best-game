// 16x10 grid, placement validity, decorations.
import { COLS, ROWS, CELL, PATH_SET, DECO_CELLS } from './config.js';

export function isPath(col, row) {
  return PATH_SET.has(`${col},${row}`);
}

export function isDeco(col, row) {
  return DECO_CELLS.has(`${col},${row}`);
}

export function canBuild(col, row, towers) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
  if (isPath(col, row)) return false;
  if (isDeco(col, row)) return false;
  if (towers.has(`${col},${row}`)) return false;
  return true;
}

export function cellCenter(col, row) {
  return [col * CELL + CELL / 2, row * CELL + CELL / 2];
}

export function pixelToCell(px, py) {
  return [Math.floor(px / CELL), Math.floor(py / CELL)];
}

// Compute total path length in pixels.
export function pathLength(waypoints) {
  let len = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const dx = waypoints[i][0] - waypoints[i - 1][0];
    const dy = waypoints[i][1] - waypoints[i - 1][1];
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}
