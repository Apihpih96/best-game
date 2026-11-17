// Enemy movement along waypoints with leftover-distance carry, HP, slow/armour effects.
import { WAYPOINTS, ENEMIES, HP_SCALE } from './config.js';
import { nextEntityId } from './state.js';

export function spawnEnemy(state, type, waveIndex, rng, opts) {
  const def = ENEMIES[type];
  const scale = HP_SCALE[waveIndex] || 1;
  const hp = Math.round(def.hp * scale);
  const e = {
    id: nextEntityId(state),
    type,
    x: opts?.x ?? WAYPOINTS[0][0],
    y: opts?.y ?? WAYPOINTS[0][1],
    wpIndex: opts?.wpIndex ?? 1,
    hp,
    maxHp: hp,
    speed: def.speed,
    baseSpeed: def.speed,
    bounty: def.bounty,
    color: def.color,
    radius: def.radius,
    armor: def.armor,
    progress: opts?.progress ?? 0,
    slowTimer: 0,
    slowAmount: 0,
    flashTimer: 0,
    alive: true,
    leaked: false,
  };
  state.enemies.push(e);
  return e;
}

export function updateEnemies(state, dt, onLeak, onKill) {
  // Mender healing: heal nearby allies (not self) within 70px.
  for (const mender of state.enemies) {
    if (!mender.alive || mender.type !== 'mender') continue;
    for (const ally of state.enemies) {
      if (ally === mender || !ally.alive || ally.hp >= ally.maxHp) continue;
      const dx = ally.x - mender.x;
      const dy = ally.y - mender.y;
      if (dx * dx + dy * dy <= 70 * 70) {
        const heal = Math.min(4 * dt, ally.maxHp - ally.hp);
        ally.hp += heal;
      }
    }
  }

  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    if (!e.alive) continue;

    // Slow effect.
    if (e.slowTimer > 0) {
      e.slowTimer -= dt;
      e.speed = e.baseSpeed * (1 - e.slowAmount);
      if (e.slowTimer <= 0) {
        e.speed = e.baseSpeed;
        e.slowAmount = 0;
      }
    }

    // Flash timer.
    if (e.flashTimer > 0) e.flashTimer -= dt;

    // Move along waypoints with leftover-distance carry.
    let remaining = e.speed * dt;
    while (remaining > 0 && e.wpIndex < WAYPOINTS.length) {
      const tx = WAYPOINTS[e.wpIndex][0];
      const ty = WAYPOINTS[e.wpIndex][1];
      const dx = tx - e.x;
      const dy = ty - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= remaining) {
        e.x = tx;
        e.y = ty;
        e.progress += dist;
        remaining -= dist;
        e.wpIndex++;
      } else {
        const ratio = remaining / dist;
        e.x += dx * ratio;
        e.y += dy * ratio;
        e.progress += remaining;
        remaining = 0;
      }
    }

    if (e.wpIndex >= WAYPOINTS.length) {
      e.alive = false;
      e.leaked = true;
      onLeak(e);
    }

    if (e.hp <= 0 && e.alive) {
      e.alive = false;
      // Splitter: spawn 2 motes at death position with same progress.
      if (e.type === 'splitter') {
        for (let s = 0; s < 2; s++) {
          spawnEnemy(state, 'mote', state.wave - 1, null, {
            x: e.x,
            y: e.y,
            wpIndex: e.wpIndex,
            progress: e.progress,
          });
        }
      }
      onKill(e);
    }
  }
  // Remove dead enemies.
  state.enemies = state.enemies.filter(e => e.alive);
}

export function damageEnemy(state, e, rawDamage, effects, opts) {
  const ignoreArmor = opts?.ignoreArmor;
  const effective = ignoreArmor ? rawDamage : rawDamage * (1 - e.armor);
  e.hp -= effective;
  e.flashTimer = 0.1;
  if (effects) {
    effects.addFloatingText(e.x, e.y - 12, Math.round(effective).toString(), '#ffcc44', 0.6);
  }
}

export function applySlow(e, amount, duration) {
  if (amount > e.slowAmount || e.slowTimer <= 0) {
    e.slowAmount = amount;
    e.slowTimer = duration;
  }
}

export function getTargetableEnemies(state) {
  return state.enemies.filter(e => e.alive && e.hp > 0);
}
