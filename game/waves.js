import { WAVES, HP_SCALE, TOTAL_WAVES, EARLY_BONUS_PER_SEC } from './config.js';
import { spawnEnemy } from './enemies.js';

export function buildSpawnQueue(waveIndex) {
  const wave = WAVES[waveIndex];
  if (!wave) return [];
  const queue = [];
  for (const g of wave.groups) {
    for (let i = 0; i < g.count; i++) {
      queue.push({ type: g.type, delay: i === 0 && queue.length > 0 ? g.spacing + 0.3 : g.spacing });
    }
  }
  return queue;
}

export function startWave(state, rng) {
  if (state.wave >= TOTAL_WAVES) return;
  state.spawnQueue = buildSpawnQueue(state.wave);
  state.spawnTimer = state.spawnQueue.length > 0 ? state.spawnQueue[0].delay : 0;
  state.waveActive = true;
  state.waveTime = 0;
  state.wave++;
}

export function updateWaveSpawning(state, dt, rng) {
  if (!state.waveActive || state.spawnQueue.length === 0) return;
  state.waveTime += dt;
  state.spawnTimer -= dt;
  while (state.spawnTimer <= 0 && state.spawnQueue.length > 0) {
    const entry = state.spawnQueue.shift();
    spawnEnemy(state, entry.type, state.wave - 1, rng);
    if (state.spawnQueue.length > 0) {
      state.spawnTimer += state.spawnQueue[0].delay;
    } else {
      break;
    }
  }
}

export function isWaveCleared(state) {
  return state.waveActive && state.spawnQueue.length === 0 && state.enemies.length === 0;
}

export function getWavePreview(waveIndex) {
  const wave = WAVES[waveIndex];
  if (!wave || !wave.preview) return null;
  return wave.preview;
}

export function getEarlyCallBonus(state) {
  if (!state.waveActive || state.spawnQueue.length === 0) return 0;
  const elapsed = state.waveTime;
  const skipped = Math.max(0, 15 - elapsed);
  return Math.floor(skipped * EARLY_BONUS_PER_SEC);
}
