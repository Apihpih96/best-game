import { TICK, FAST_MULT, CANVAS_W, CANVAS_H, TOTAL_WAVES, TOWERS, WAVES } from './config.js';
import { createState, resetState, PHASES } from './state.js';
import { canBuild } from './board.js';
import { placeTower, upgradeTower, sellTower, cycleTargetMode, updateTowers, getTowerStats } from './towers.js';
import { updateEnemies, getTargetableEnemies } from './enemies.js';
import { spawnBolt, updateProjectiles } from './projectiles.js';
import { createEffects, addDeathParticles, addHitParticles, addSplashRing, addFloatingText, addShake, updateEffects } from './effects.js';
import { initAudio, play, setMuted, startPad, stopPad } from './audio.js';
import { drawBoard, drawTowers, drawEnemies, drawProjectiles, drawEffects, drawPlacementGhost, drawSelectedTowerRange } from './render.js';
import { initCards, updateHud, updateSelected, updateWaveButton, updatePreview, updateControls, showOverlay, hideOverlay, showBanner } from './hud.js';
import { initInput } from './input.js';
import { startWave, updateWaveSpawning, isWaveCleared } from './waves.js';
import { createRng } from './rng.js';
import { saveBestScore } from './storage.js';
import { parseShotParams, setupShotScene } from './shots.js';

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const state = createState();
const fx = createEffects();
fx.addFloatingText = (x, y, text, color, dur) => addFloatingText(fx, x, y, text, color, dur);
fx.addHitParticles = (x, y, color) => addHitParticles(fx, x, y, color);
fx.addDeathParticles = (x, y, color) => addDeathParticles(fx, x, y, color);
fx.addSplashRing = (x, y, r, color) => addSplashRing(fx, x, y, r, color);
fx.addShake = (t) => addShake(fx, t);
let rng = createRng(Date.now());
let mouseCol = -1, mouseRow = -1;
let audioInited = false;

function ensureAudio() {
  if (!audioInited) { initAudio(); audioInited = true; startPad(); }
}

const shotParams = parseShotParams();

function spawnProjectile(tower, target, stats) {
  const def = TOWERS[tower.type];
  tower._color = def.color;
  const p = spawnBolt(tower, target, stats, tower.type);
  p.color = def.color;
  state.projectiles.push(p);
  play('shoot');
}

function onEnemyLeak(e) {
  state.light -= 1;
  state.leaks++;
  state.score = Math.max(0, state.score - e.bounty);
  addShake(fx, 0.3);
  play('leak');
  addFloatingText(fx, e.x, e.y, '-1 ☀', '#ff4444', 1.0);
  if (state.light <= 0) {
    state.light = 0;
    state.phase = PHASES.DEFEAT;
    play('defeat');
    stopPad();
    saveBestScore(state.score);
    showOverlay('defeat', state, handleRestart);
  }
}

function onEnemyKill(e) {
  state.glimmers += e.bounty;
  state.score += e.bounty * 10;
  play('coin');
  addDeathParticles(fx, e.x, e.y, e.color);
  addFloatingText(fx, e.x, e.y - 20, `+${e.bounty}`, '#ffd866', 0.8);
}

function handleSelectCard(type) {
  ensureAudio();
  play('click');
  state.selectedTower = null;
  state.selectedCard = state.selectedCard === type ? null : type;
}

function handleCellClick(col, row) {
  ensureAudio();
  if (state.phase !== PHASES.BUILD && state.phase !== PHASES.WAVE) return;
  if (state.selectedCard) {
    if (canBuild(col, row, state.towers) && state.glimmers >= TOWERS[state.selectedCard].cost) {
      placeTower(state, state.selectedCard, col, row);
      play('place');
      state.selectedCard = null;
    }
    return;
  }
  const key = `${col},${row}`;
  if (state.towers.has(key)) {
    state.selectedTower = state.towers.get(key);
    play('click');
  } else {
    state.selectedTower = null;
  }
}

function handleUpgrade() {
  if (!state.selectedTower) return;
  if (upgradeTower(state, state.selectedTower)) {
    play('upgrade');
  }
}

function handleSell() {
  if (!state.selectedTower) return;
  sellTower(state, state.selectedTower);
  play('sell');
}

function handleCycle() {
  if (!state.selectedTower) return;
  cycleTargetMode(state.selectedTower);
  play('click');
}

function handleStartWave() {
  ensureAudio();
  if (state.waveActive || state.wave >= TOTAL_WAVES) return;
  if (state.phase !== PHASES.BUILD) return;
  startWave(state, rng);
  state.phase = PHASES.WAVE;
  play('waveStart');
  showBanner(`Wave ${state.wave}`, 2);
}

function handleTogglePause() {
  ensureAudio();
  if (state.phase === PHASES.PAUSED) {
    state.phase = state.prevPhase || PHASES.BUILD;
    state.prevPhase = null;
    hideOverlay();
  } else if (state.phase === PHASES.BUILD || state.phase === PHASES.WAVE) {
    state.prevPhase = state.phase;
    state.phase = PHASES.PAUSED;
    showOverlay('paused', state, handleTogglePause);
  }
}

function handleToggleFast() {
  state.fastForward = !state.fastForward;
  play('click');
}

function handleToggleMute() {
  state.muted = !state.muted;
  setMuted(state.muted);
}

function handleCancel() {
  state.selectedCard = null;
  state.selectedTower = null;
}

function handleStartGame() {
  ensureAudio();
  resetState(state);
  state.phase = PHASES.BUILD;
  state.startTime = performance.now();
  hideOverlay();
  play('click');
}

function handleRestart() {
  ensureAudio();
  resetState(state);
  rng = createRng(Date.now());
  state.phase = PHASES.BUILD;
  state.startTime = performance.now();
  hideOverlay();
  startPad();
  play('click');
}

const input = initInput(canvas, state, {
  onMouseMove(px, py) {
    if (px < 0) { mouseCol = -1; mouseRow = -1; return; }
    if (px > 800) { mouseCol = -1; mouseRow = -1; return; }
    mouseCol = Math.floor(px / 50);
    mouseRow = Math.floor(py / 50);
  },
  onCellClick: handleCellClick,
  onStartGame: handleStartGame,
  onRestart: handleRestart,
  onTogglePause: handleTogglePause,
  onToggleFast: handleToggleFast,
  onToggleMute: handleToggleMute,
  onStartWave: handleStartWave,
  onCancel: handleCancel,
  onSelectCard: handleSelectCard,
});

initCards(handleSelectCard);

function update(dt) {
  if (state.phase === PHASES.PAUSED || state.phase === PHASES.TITLE ||
      state.phase === PHASES.VICTORY || state.phase === PHASES.DEFEAT) return;

  state.elapsed += dt;

  updateWaveSpawning(state, dt, rng);
  updateTowers(state, dt, spawnProjectile);
  updateProjectiles(state, dt, { play }, fx);
  updateEnemies(state, dt, onEnemyLeak, onEnemyKill);
  updateEffects(fx, dt);

  if (isWaveCleared(state)) {
    state.waveActive = false;
    const wave = state.wave;
    if (wave > 0) {
      const bonus = WAVES[wave - 1]?.clearBonus || 0;
      state.glimmers += bonus;
      state.score += bonus * 5;
      if (bonus > 0) {
        addFloatingText(fx, 400, 250, `Wave clear! +${bonus}✦`, '#ffd866', 1.5);
      }
    }
    if (state.wave >= TOTAL_WAVES) {
      state.phase = PHASES.VICTORY;
      play('victory');
      stopPad();
      saveBestScore(state.score);
      showOverlay('victory', state, handleRestart);
    } else {
      state.phase = PHASES.BUILD;
      showBanner(`Wave ${state.wave} cleared!`, 2);
    }
  }
}

function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawBoard(ctx, fx);
  drawTowers(ctx, state);

  if (state.selectedTower) {
    drawSelectedTowerRange(ctx, state.selectedTower);
  }

  drawEnemies(ctx, state);
  drawProjectiles(ctx, state);
  drawEffects(ctx, fx);

  if (state.selectedCard && mouseCol >= 0 && mouseRow >= 0) {
    const valid = canBuild(mouseCol, mouseRow, state.towers) && state.glimmers >= TOWERS[state.selectedCard].cost;
    drawPlacementGhost(ctx, mouseCol, mouseRow, valid, state.selectedCard);
    if (valid) {
      const stats = TOWERS[state.selectedCard].levels[0];
      const cx = mouseCol * 50 + 25, cy = mouseRow * 50 + 25;
      ctx.strokeStyle = 'rgba(200,200,255,0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, stats.range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  updateHud(state);
  updateWaveButton(state, handleStartWave);
  updatePreview(state);
  updateControls(state, handleToggleFast, handleTogglePause, handleToggleMute);
  updateSelected(state, handleUpgrade, handleSell, handleCycle);
}

let lastTime = 0;
let accumulator = 0;

function gameLoop(timestamp) {
  const delta = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  const mult = state.fastForward ? FAST_MULT : 1;
  accumulator += delta * mult;

  while (accumulator >= TICK) {
    update(TICK);
    accumulator -= TICK;
  }

  render();
  requestAnimationFrame(gameLoop);
}

if (shotParams) {
  setupShotScene(state, shotParams.shot, shotParams.seed, rng);
  if (state.phase === PHASES.TITLE) {
    showOverlay('title', state, handleStartGame);
  } else if (state.phase === PHASES.VICTORY) {
    showOverlay('victory', state, handleRestart);
  } else if (state.phase === PHASES.DEFEAT) {
    showOverlay('defeat', state, handleRestart);
  }
  render();
} else {
  showOverlay('title', state, handleStartGame);
}

requestAnimationFrame((ts) => { lastTime = ts; gameLoop(ts); });
