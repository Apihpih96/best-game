import { PHASES } from './state.js';
import { placeTower } from './towers.js';
import { spawnEnemy } from './enemies.js';
import { TOWERS, WAYPOINTS, TOTAL_WAVES } from './config.js';

export function parseShotParams() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = parseInt(params.get('seed') || '1', 10);
  if (!shot) return null;
  return { shot, seed };
}

export function setupShotScene(state, shot, seed, rng) {
  if (shot === 'start') {
    state.phase = PHASES.TITLE;
    requestShotReady();
    return;
  }

  if (shot === 'play') {
    setupPlayScene(state, rng);
    state.phase = PHASES.WAVE;
    state.waveActive = true;
    requestShotReady();
    return;
  }

  if (shot === 'victory') {
    setupPlayScene(state, rng);
    state.phase = PHASES.VICTORY;
    state.wave = TOTAL_WAVES;
    state.score = 12450;
    state.elapsed = 312;
    requestShotReady();
    return;
  }

  if (shot === 'defeat') {
    setupPlayScene(state, rng);
    state.phase = PHASES.DEFEAT;
    state.wave = 7;
    state.light = 0;
    state.score = 5320;
    state.leaks = 20;
    state.elapsed = 245;
    requestShotReady();
    return;
  }
}

function setupPlayScene(state, rng) {
  state.wave = 6;
  state.light = 14;
  state.score = 4820;
  state.elapsed = 185;
  state.towersBuilt = 0;

  placeTower(state, 'prism', 3, 3);
  placeTower(state, 'prism', 5, 7);
  placeTower(state, 'ember', 7, 3);
  placeTower(state, 'ember', 10, 7);
  placeTower(state, 'frost', 4, 5);
  placeTower(state, 'frost', 11, 3);
  placeTower(state, 'arc', 9, 5);
  placeTower(state, 'prism', 12, 5);
  state.glimmers = 180;

  const enemyTypes = ['mote', 'skulker', 'husk', 'mote', 'skulker', 'wisp'];
  for (let i = 0; i < 6; i++) {
    const type = enemyTypes[i];
    const e = spawnEnemy(state, type, 5, rng);
    e.wpIndex = Math.min(2 + i, WAYPOINTS.length - 1);
    e.progress = 100 + i * 80;
  }
}

function requestShotReady() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.__shotReady = true;
    });
  });
}
