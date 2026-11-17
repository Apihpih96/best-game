// Projectiles: bolts, splash, chain lightning.
import { nextEntityId } from './state.js';
import { damageEnemy, applySlow } from './enemies.js';

export function spawnBolt(tower, target, stats, type, dmgMult) {
  return {
    id: tower._projId || 0,
    type: type || 'bolt',
    x: tower.x,
    y: tower.y,
    tx: target.x,
    ty: target.y,
    targetId: target.id,
    damage: stats.damage * (dmgMult ?? 1),
    speed: 400,
    splash: stats.splash || 0,
    slow: stats.slow || 0,
    slowDur: stats.slowDur || 0,
    chain: stats.chain || 0,
    chainTargets: [],
    color: tower._color || '#fff',
    alive: true,
    towerType: tower.type,
    // Lance pierce: ignore armour.
    ignoreArmor: !!stats.pierce,
  };
}

export function updateProjectiles(state, dt, audio, effects) {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const p = state.projectiles[i];
    if (!p.alive) { state.projectiles.splice(i, 1); continue; }

    // Find target enemy (may have died).
    let target = state.enemies.find(e => e.id === p.targetId && e.alive);
    if (target) {
      p.tx = target.x;
      p.ty = target.y;
    }

    const dx = p.tx - p.x;
    const dy = p.ty - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = p.speed * dt;

    if (dist <= step) {
      // Hit.
      p.alive = false;
      if (target && target.alive) {
        damageEnemy(state, target, p.damage, effects, { ignoreArmor: p.ignoreArmor });
        audio.play('hit');
        effects.addHitParticles(target.x, target.y, p.color);

        // Splash damage.
        if (p.splash > 0) {
          for (const e of state.enemies) {
            if (e === target || !e.alive) continue;
            const sd = Math.sqrt((e.x - target.x) ** 2 + (e.y - target.y) ** 2);
            if (sd <= p.splash) {
              damageEnemy(state, e, p.damage * 0.6, effects, { ignoreArmor: p.ignoreArmor });
            }
          }
          effects.addSplashRing(target.x, target.y, p.splash, p.color);
        }

        // Slow.
        if (p.slow > 0 && target.alive) {
          applySlow(target, p.slow, p.slowDur);
        }

        // Chain lightning.
        if (p.chain > 0) {
          let lastX = target.x, lastY = target.y;
          const hit = new Set([target.id]);
          for (let c = 0; c < p.chain; c++) {
            let best = null, bestDist = 120 * 120;
            for (const e of state.enemies) {
              if (!e.alive || hit.has(e.id)) continue;
              const d = (e.x - lastX) ** 2 + (e.y - lastY) ** 2;
              if (d < bestDist) { bestDist = d; best = e; }
            }
            if (!best) break;
            hit.add(best.id);
            damageEnemy(state, best, p.damage * 0.7, effects, { ignoreArmor: p.ignoreArmor });
            p.chainTargets.push({ x1: lastX, y1: lastY, x2: best.x, y2: best.y });
            lastX = best.x;
            lastY = best.y;
          }
        }
      }
      state.projectiles.splice(i, 1);
    } else {
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
    }
  }
}
