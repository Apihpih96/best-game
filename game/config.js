// All tuning data for Glimmerhold.
export const COLS = 16;
export const ROWS = 10;
export const CELL = 50;
export const BOARD_W = COLS * CELL;
export const BOARD_H = ROWS * CELL;
export const HUD_W = 160;
export const CANVAS_W = BOARD_W + HUD_W;
export const CANVAS_H = BOARD_H;
export const TICK = 1 / 60;
export const FAST_MULT = 2;

export const START_GLOW = 220;
export const START_LIGHT = 20;
export const SELL_REFUND = 0.7;
export const TOTAL_WAVES = 12;

// Serpentine waypoint path (grid coords). Enemies enter from left, wind across the board.
export const PATH_CELLS = [
  [0, 8], [13, 8], [13, 6], [2, 6], [2, 4], [13, 4], [13, 2], [2, 2], [2, 1], [15, 1]
];

// Pixel waypoints (center of each cell).
export const WAYPOINTS = PATH_CELLS.map(([c, r]) => [c * CELL + CELL / 2, r * CELL + CELL / 2]);

// Pre-compute path cells for placement validation.
export function buildPathCells() {
  const cells = new Set();
  for (let i = 0; i < PATH_CELLS.length - 1; i++) {
    const [c0, r0] = PATH_CELLS[i];
    const [c1, r1] = PATH_CELLS[i + 1];
    if (r0 === r1) {
      const lo = Math.min(c0, c1), hi = Math.max(c0, c1);
      for (let c = lo; c <= hi; c++) cells.add(`${c},${r0}`);
    } else {
      const lo = Math.min(r0, r1), hi = Math.max(r0, r1);
      for (let r = lo; r <= hi; r++) cells.add(`${c0},${r}`);
    }
  }
  return cells;
}

export const PATH_SET = buildPathCells();

// Decoration cells (non-buildable, non-path, visual only).
export const DECO_CELLS = new Set([
  '5,0', '10,0', '0,5', '15,5', '7,3', '8,7', '11,9', '4,9', '14,3', '1,3'
]);

export const TOWERS = {
  prism: {
    name: 'Prism Spire', key: '1', cost: 50, color: '#7b8cff',
    levels: [
      { damage: 10, range: 120, cooldown: 0.5, desc: 'Fast single-target' },
      { damage: 16, range: 135, cooldown: 0.42, desc: '+dmg +range', cost: 40 },
      { damage: 26, range: 150, cooldown: 0.35, desc: '+dmg +range +rate', cost: 65 },
    ],
  },
  ember: {
    name: 'Ember Spire', key: '2', cost: 80, color: '#ff6644',
    levels: [
      { damage: 14, range: 110, cooldown: 0.9, splash: 45, desc: 'Splash damage' },
      { damage: 22, range: 120, cooldown: 0.8, splash: 55, desc: '+splash +dmg', cost: 60 },
      { damage: 35, range: 130, cooldown: 0.7, splash: 65, desc: '+all', cost: 90 },
    ],
  },
  frost: {
    name: 'Frost Spire', key: '3', cost: 60, color: '#66ddff',
    levels: [
      { damage: 6, range: 115, cooldown: 0.7, slow: 0.4, slowDur: 2.0, desc: 'Slows enemies' },
      { damage: 10, range: 125, cooldown: 0.6, slow: 0.5, slowDur: 2.5, desc: '+slow +range', cost: 50 },
      { damage: 16, range: 140, cooldown: 0.5, slow: 0.6, slowDur: 3.0, desc: '+all', cost: 75 },
    ],
  },
  arc: {
    name: 'Arc Spire', key: '4', cost: 120, color: '#cc88ff',
    levels: [
      { damage: 20, range: 130, cooldown: 1.1, chain: 2, desc: 'Chain lightning' },
      { damage: 32, range: 140, cooldown: 0.95, chain: 3, desc: '+chain +dmg', cost: 90 },
      { damage: 50, range: 155, cooldown: 0.8, chain: 4, desc: '+all', cost: 130 },
    ],
  },
  lance: {
    name: 'Lance Spire', key: '5', cost: 100, color: '#ffcc44',
    levels: [
      { damage: 45, range: 200, cooldown: 1.6, pierce: true, desc: 'Ignores armour' },
      { damage: 68, range: 220, cooldown: 1.4, pierce: true, desc: '+dmg +range', cost: 80 },
      { damage: 105, range: 240, cooldown: 1.2, pierce: true, desc: '+all', cost: 120 },
    ],
  },
  bloom: {
    name: 'Bloom Spire', key: '6', cost: 70, color: '#44dd88',
    levels: [
      { damage: 8, range: 90, cooldown: 0.8, auraRadius: 110, auraBonus: 0.25, desc: 'Aura: +25% nearby dmg' },
      { damage: 12, range: 100, cooldown: 0.7, auraRadius: 110, auraBonus: 0.25, desc: '+dmg +rate', cost: 55 },
      { damage: 18, range: 115, cooldown: 0.6, auraRadius: 110, auraBonus: 0.25, desc: '+dmg +rate', cost: 80 },
    ],
  },
};

export const TOWER_ORDER = ['prism', 'ember', 'frost', 'arc', 'lance', 'bloom'];

export const ENEMIES = {
  mote:      { name: 'Mote',      hp: 30,  speed: 55,  bounty: 5,  color: '#886644', radius: 8,  armor: 0 },
  skulker:   { name: 'Skulker',   hp: 18,  speed: 100, bounty: 8,  color: '#44aa44', radius: 6,  armor: 0 },
  husk:      { name: 'Husk',      hp: 100, speed: 32,  bounty: 15, color: '#887766', radius: 12, armor: 0.3 },
  wisp:      { name: 'Wisp',      hp: 14,  speed: 130, bounty: 10, color: '#aaddff', radius: 5,  armor: 0 },
  gloombrute:{ name: 'Gloombrute',hp: 900, speed: 22,  bounty: 120,color: '#442244', radius: 18, armor: 0.2 },
  splitter:  { name: 'Splitter',  hp: 60,  speed: 40,  bounty: 12, color: '#aa6688', radius: 10, armor: 0 },
  mender:    { name: 'Mender',    hp: 50,  speed: 45,  bounty: 14, color: '#66bb66', radius: 9,  armor: 0 },
};

// Wave data: 12 waves. Each new type is telegraphed one wave ahead and introduced alone first.
export const WAVES = [
  { groups: [{ type: 'mote', count: 8, spacing: 0.8 }], clearBonus: 20 },
  { groups: [{ type: 'mote', count: 12, spacing: 0.65 }], clearBonus: 25, preview: 'mote' },
  { groups: [{ type: 'skulker', count: 8, spacing: 0.5 }], clearBonus: 30, preview: 'skulker' },
  { groups: [{ type: 'mote', count: 10, spacing: 0.6 }, { type: 'skulker', count: 5, spacing: 0.45 }], clearBonus: 35 },
  { groups: [{ type: 'husk', count: 4, spacing: 1.4 }], clearBonus: 40, preview: 'husk' },
  { groups: [{ type: 'mote', count: 12, spacing: 0.5 }, { type: 'husk', count: 3, spacing: 1.2 }], clearBonus: 45 },
  { groups: [{ type: 'skulker', count: 10, spacing: 0.35 }, { type: 'husk', count: 4, spacing: 1.0 }], clearBonus: 50 },
  { groups: [{ type: 'wisp', count: 10, spacing: 0.35 }], clearBonus: 55, preview: 'wisp' },
  { groups: [{ type: 'husk', count: 6, spacing: 0.9 }, { type: 'wisp', count: 8, spacing: 0.3 }, { type: 'skulker', count: 6, spacing: 0.35 }], clearBonus: 65 },
  { groups: [{ type: 'splitter', count: 6, spacing: 1.0 }], clearBonus: 60, preview: 'splitter' },
  { groups: [{ type: 'gloombrute', count: 1, spacing: 0 }, { type: 'mote', count: 10, spacing: 0.5 }, { type: 'splitter', count: 4, spacing: 0.8 }], clearBonus: 100, preview: 'gloombrute' },
  { groups: [{ type: 'gloombrute', count: 1, spacing: 0 }, { type: 'mender', count: 3, spacing: 1.2 }, { type: 'splitter', count: 6, spacing: 0.7 }, { type: 'skulker', count: 8, spacing: 0.4 }], clearBonus: 150, preview: 'mender' },
];

// HP scaling per wave (applied multiplicatively to base enemy HP).
export const HP_SCALE = [1.0, 1.1, 1.2, 1.32, 1.45, 1.6, 1.78, 1.98, 2.2, 2.5, 2.75, 3.0];

// Early-call bonus: glimmers per second of build time skipped.
export const EARLY_BONUS_PER_SEC = 2;

// Targeting modes.
export const TARGET_MODES = ['first', 'strongest', 'closest'];
