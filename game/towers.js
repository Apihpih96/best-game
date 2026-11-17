// Tower logic: placement, target acquisition, firing, upgrades, sell.
import { TOWERS, TOWER_ORDER, CELL, TARGET_MODES, SELL_REFUND } from './config.js';
import { canBuild, cellCenter } from './board.js';
import { nextEntityId } from './state.js';

export function placeTower(state, type, col, row) {
  const def = TOWERS[type];
  if (!def || state.glimmers < def.cost) return false;
  if (!canBuild(col, row, state.towers)) return false;
  state.glimmers -= def.cost;
  const [cx, cy] = cellCenter(col, row);
  const tower = {
    id: nextEntityId(state),
    type,
    col, row,
    x: cx, y: cy,
    level: 0,
    cooldownTimer: 0,
    targetMode: 'first',
    totalSpent: def.cost,
    angle: 0,
    // Juice: muzzle flash timer.
    flashTimer: 0,
  };
  state.towers.set(`${col},${row}`, tower);
  state.towersBuilt++;
  return true;
}

export function getTowerStats(tower) {
  return TOWERS[tower.type].levels[tower.level];
}

export function getUpgradeCost(tower) {
  if (tower.level >= TOWERS[tower.type].levels.length - 1) return null;
  return TOWERS[tower.type].levels[tower.level + 1].cost;
}

export function upgradeTower(state, tower) {
  const cost = getUpgradeCost(tower);
  if (cost === null || state.glimmers < cost) return false;
  state.glimmers -= cost;
  tower.level++;
  tower.totalSpent += cost;
  return true;
}

export function sellTower(state, tower) {
  const refund = Math.floor(tower.totalSpent * SELL_REFUND);
  state.glimmers += refund;
  state.towers.delete(`${tower.col},${tower.row}`);
  if (state.selectedTower === tower) state.selectedTower = null;
  return refund;
}

export function cycleTargetMode(tower) {
  const idx = TARGET_MODES.indexOf(tower.targetMode);
  tower.targetMode = TARGET_MODES[(idx + 1) % TARGET_MODES.length];
}

export function acquireTarget(tower, enemies) {
  const stats = getTowerStats(tower);
  const inRange = enemies.filter(e => {
    const dx = e.x - tower.x;
    const dy = e.y - tower.y;
    return dx * dx + dy * dy <= stats.range * stats.range;
  });
  if (inRange.length === 0) return null;
  switch (tower.targetMode) {
    case 'first': return inRange.reduce((a, b) => a.progress > b.progress ? a : b);
    case 'strongest': return inRange.reduce((a, b) => a.hp > b.hp ? a : b);
    case 'closest': return inRange.reduce((a, b) => {
      const da = (a.x - tower.x) ** 2 + (a.y - tower.y) ** 2;
      const db = (b.x - tower.x) ** 2 + (b.y - tower.y) ** 2;
      return da < db ? a : b;
    });
    default: return inRange[0];
  }
}

export function updateTowers(state, dt, spawnProjectile) {
  for (const tower of state.towers.values()) {
    // Tick muzzle flash.
    if (tower.flashTimer > 0) tower.flashTimer -= dt;

    // Bloom Spire is aura-only — it never fires.
    if (tower.type === 'bloom') continue;

    tower.cooldownTimer -= dt;
    if (tower.cooldownTimer > 0) continue;
    const target = acquireTarget(tower, state.enemies);
    if (!target) continue;
    const stats = getTowerStats(tower);

    // Bloom aura: compute damage multiplier from nearby bloom towers.
    let dmgMult = 1;
    if (tower.type !== 'bloom') {
      for (const other of state.towers.values()) {
        if (other === tower || other.type !== 'bloom') continue;
        const oStats = getTowerStats(other);
        if (!oStats.auraRadius) continue;
        const dx = other.x - tower.x;
        const dy = other.y - tower.y;
        if (dx * dx + dy * dy <= oStats.auraRadius * oStats.auraRadius) {
          dmgMult += oStats.auraBonus;
        }
      }
    }

    tower.cooldownTimer = stats.cooldown;
    tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
    tower.flashTimer = 0.12;
    spawnProjectile(tower, target, stats, dmgMult);
  }
}
