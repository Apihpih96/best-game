// Game state + state machine.
import { START_GLOW, START_LIGHT, TOTAL_WAVES } from './config.js';

export const PHASES = {
  TITLE: 'title',
  BUILD: 'build',
  WAVE: 'wave',
  PAUSED: 'paused',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
};

export function createState() {
  return {
    phase: PHASES.TITLE,
    prevPhase: null,
    glimmers: START_GLOW,
    light: START_LIGHT,
    wave: 0,
    score: 0,
    towers: new Map(),
    enemies: [],
    projectiles: [],
    effects: [],
    floatingTexts: [],
    selectedCard: null,
    selectedTower: null,
    fastForward: false,
    muted: false,
    waveActive: false,
    waveTime: 0,
    spawnQueue: [],
    spawnTimer: 0,
    leaks: 0,
    towersBuilt: 0,
    startTime: 0,
    elapsed: 0,
    shakeTrauma: 0,
    shakeTime: 0,
    bannerText: '',
    bannerTimer: 0,
    nextId: 1,
  };
}

export function nextEntityId(state) {
  return state.nextId++;
}

export function resetState(state) {
  state.phase = PHASES.TITLE;
  state.prevPhase = null;
  state.glimmers = START_GLOW;
  state.light = START_LIGHT;
  state.wave = 0;
  state.score = 0;
  state.towers.clear();
  state.enemies.length = 0;
  state.projectiles.length = 0;
  state.effects.length = 0;
  state.floatingTexts.length = 0;
  state.selectedCard = null;
  state.selectedTower = null;
  state.fastForward = false;
  state.waveActive = false;
  state.waveTime = 0;
  state.spawnQueue.length = 0;
  state.spawnTimer = 0;
  state.leaks = 0;
  state.towersBuilt = 0;
  state.startTime = 0;
  state.elapsed = 0;
  state.shakeTrauma = 0;
  state.shakeTime = 0;
  state.bannerText = '';
  state.bannerTimer = 0;
  state.nextId = 1;
}
