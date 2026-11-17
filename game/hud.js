import { TOWERS, TOWER_ORDER, TOTAL_WAVES, SELL_REFUND, ENEMIES } from './config.js';
import { getTowerStats, getUpgradeCost, cycleTargetMode } from './towers.js';
import { getWavePreview } from './waves.js';
import { loadBestScore } from './storage.js';

const $ = (id) => document.getElementById(id);

export function initCards(onSelect) {
  const container = $('hud-cards');
  container.innerHTML = '';
  for (const key of TOWER_ORDER) {
    const def = TOWERS[key];
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.type = key;
    card.innerHTML = `<span class="card-name">${def.name} <span class="card-key">[${def.key}]</span></span><span class="card-cost">✦${def.cost}</span>`;
    card.addEventListener('click', () => onSelect(key));
    container.appendChild(card);
  }
}

export function updateCards(glimmers, selectedCard) {
  const cards = document.querySelectorAll('.card');
  for (const card of cards) {
    const type = card.dataset.type;
    const def = TOWERS[type];
    card.classList.toggle('selected', selectedCard === type);
    card.classList.toggle('disabled', glimmers < def.cost);
  }
}

export function updateTop(state) {
  $('hud-glimmers').textContent = `✦ ${state.glimmers}`;
  $('hud-light').textContent = `☀ ${state.light}`;
  $('hud-wave').textContent = `Wave ${state.wave}/${TOTAL_WAVES}`;
  $('hud-score').textContent = state.score.toString();
}

// Cache for selected panel to avoid per-frame DOM rebuild
let _selCache = null;

export function updateSelected(state, onUpgrade, onSell, onCycle) {
  const panel = $('hud-selected');
  const tower = state.selectedTower;

  if (!tower) {
    if (_selCache !== null) {
      panel.innerHTML = '<div style="color:#666">Click a tower to select</div>';
      _selCache = null;
    }
    return;
  }

  const def = TOWERS[tower.type];
  const stats = getTowerStats(tower);
  const upCost = getUpgradeCost(tower);
  const sellVal = Math.floor(tower.totalSpent * SELL_REFUND);
  const canUp = upCost !== null && state.glimmers >= upCost;

  // Key covers all values that affect panel content
  const key = `${tower.type}|${tower.level}|${stats.damage}|${stats.range}|${tower.targetMode}|${upCost}|${sellVal}|${canUp}`;
  if (_selCache === key) return;
  _selCache = key;

  let html = `<div class="sel-title">${def.name} Lv.${tower.level + 1}</div>`;
  html += `<div class="sel-stat">Dmg: ${stats.damage} | Rng: ${stats.range}</div>`;
  html += `<div class="sel-stat">${stats.desc}</div>`;
  html += `<div class="sel-stat">Target: ${tower.targetMode}</div>`;
  html += `<button id="btn-upgrade" ${!canUp ? 'disabled' : ''}>${upCost !== null ? `Upgrade ✦${upCost}` : 'MAX'}</button>`;
  html += `<button id="btn-sell">Sell ✦${sellVal}</button>`;
  html += `<button id="btn-cycle">⊕</button>`;
  panel.innerHTML = html;

  const ub = $('btn-upgrade');
  if (ub) ub.addEventListener('click', onUpgrade);
  const sb = $('btn-sell');
  if (sb) sb.addEventListener('click', onSell);
  const cb = $('btn-cycle');
  if (cb) cb.addEventListener('click', onCycle);
}

export function updateWaveButton(state, onStartWave) {
  const btn = $('btn-wave');
  if (state.waveActive) {
    btn.textContent = 'In progress';
    btn.disabled = true;
  } else if (state.wave >= TOTAL_WAVES) {
    btn.textContent = 'Complete';
    btn.disabled = true;
  } else {
    btn.textContent = `Start Wave ${state.wave + 1}`;
    btn.disabled = false;
    btn.onclick = onStartWave;
  }
}

export function updatePreview(state) {
  const el = $('hud-preview');
  const next = getWavePreview(state.wave);
  if (next && ENEMIES[next]) {
    el.textContent = `Next: ${ENEMIES[next].name}`;
  } else {
    el.textContent = state.wave < TOTAL_WAVES ? 'Build phase' : '';
  }
}

export function updateControls(state, onFast, onPause, onMute) {
  const fastBtn = $('btn-fast');
  const pauseBtn = $('btn-pause');
  const muteBtn = $('btn-mute');
  fastBtn.classList.toggle('active', state.fastForward);
  pauseBtn.classList.toggle('active', state.phase === 'paused');
  muteBtn.textContent = state.muted ? '🔇' : '🔊';
  fastBtn.onclick = onFast;
  pauseBtn.onclick = onPause;
  muteBtn.onclick = onMute;
}

export function showOverlay(type, state, onAction) {
  const overlay = $('overlay');
  overlay.classList.remove('hidden');
  if (type === 'title') {
    const best = loadBestScore();
    overlay.innerHTML = `
      <h1>✦ Glimmerhold ✦</h1>
      <p>Defend the crystal against the shadow horde.<br>Place towers, upgrade, survive 10 waves.</p>
      <p style="font-size:12px;color:#888;margin-top:8px">Keys: 1-4 towers, Space wave, P pause, F fast, M mute, Esc cancel</p>
      ${best > 0 ? `<p>Best score: ${best}</p>` : ''}
      <button id="btn-start">Play</button>
      <div class="keys">Press Enter to start</div>
    `;
    $('btn-start').addEventListener('click', onAction);
  } else if (type === 'victory') {
    const elapsed = Math.floor(state.elapsed);
    overlay.innerHTML = `
      <h1>✦ Victory! ✦</h1>
      <h2>The crystal is safe!</h2>
      <div class="stats">
        <div>Score: ${state.score}</div>
        <div>Waves survived: ${state.wave}/${TOTAL_WAVES}</div>
        <div>Leaks: ${state.leaks}</div>
        <div>Time: ${elapsed}s</div>
        <div>Towers built: ${state.towersBuilt}</div>
      </div>
      <button id="btn-restart">Play Again</button>
      <div class="keys">Press R to restart</div>
    `;
    $('btn-restart').addEventListener('click', onAction);
  } else if (type === 'defeat') {
    const elapsed = Math.floor(state.elapsed);
    overlay.innerHTML = `
      <h1 style="color:#ff6644">✦ Defeat ✦</h1>
      <h2>The crystal has fallen...</h2>
      <div class="stats">
        <div>Score: ${state.score}</div>
        <div>Waves survived: ${state.wave}/${TOTAL_WAVES}</div>
        <div>Leaks: ${state.leaks}</div>
        <div>Time: ${elapsed}s</div>
        <div>Towers built: ${state.towersBuilt}</div>
      </div>
      <button id="btn-restart">Try Again</button>
      <div class="keys">Press R to restart</div>
    `;
    $('btn-restart').addEventListener('click', onAction);
  } else if (type === 'paused') {
    overlay.innerHTML = `
      <h1>⏸ Paused</h1>
      <p>Press P or click to resume</p>
      <button id="btn-resume">Resume</button>
    `;
    $('btn-resume').addEventListener('click', onAction);
  }
}

export function hideOverlay() {
  $('overlay').classList.add('hidden');
}

export function showBanner(text, duration) {
  const banner = $('banner');
  banner.textContent = text;
  banner.classList.remove('hidden');
  if (banner._timer) clearTimeout(banner._timer);
  banner._timer = setTimeout(() => banner.classList.add('hidden'), (duration || 2) * 1000);
}

export function updateHud(state) {
  updateTop(state);
  updateCards(state.glimmers, state.selectedCard);
}
