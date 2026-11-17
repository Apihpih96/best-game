import { COLS, ROWS, CELL, BOARD_W, BOARD_H, TOWERS, WAYPOINTS, PATH_SET, DECO_CELLS } from './config.js';
import { getTowerStats } from './towers.js';
import { getShakeOffset } from './effects.js';

const PATH_COLOR = '#3a3228';
const GRASS_COLOR = '#1a2a1a';
const GRASS_ALT = '#1e2e1e';
const DECO_COLOR = '#2a3a4a';

export function drawBoard(ctx, fx) {
  const [sx, sy] = getShakeOffset(fx);
  ctx.save();
  ctx.translate(sx, sy);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * CELL, y = r * CELL;
      const key = `${c},${r}`;
      if (PATH_SET.has(key)) {
        ctx.fillStyle = PATH_COLOR;
      } else if (DECO_CELLS.has(key)) {
        ctx.fillStyle = DECO_COLOR;
      } else {
        ctx.fillStyle = (c + r) % 2 === 0 ? GRASS_COLOR : GRASS_ALT;
      }
      ctx.fillRect(x, y, CELL, CELL);
    }
  }

  ctx.strokeStyle = 'rgba(60,70,90,0.15)';
  ctx.lineWidth = 0.5;
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(BOARD_W, r * CELL); ctx.stroke();
  }
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, BOARD_H); ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(180,160,120,0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(WAYPOINTS[0][0], WAYPOINTS[0][1]);
  for (let i = 1; i < WAYPOINTS.length; i++) {
    ctx.lineTo(WAYPOINTS[i][0], WAYPOINTS[i][1]);
  }
  ctx.stroke();

  for (const key of DECO_CELLS) {
    const [c, r] = key.split(',').map(Number);
    const cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2;
    ctx.fillStyle = 'rgba(100,140,180,0.3)';
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawTowers(ctx, state) {
  for (const tower of state.towers.values()) {
    const def = TOWERS[tower.type];
    const stats = getTowerStats(tower);
    const x = tower.x, y = tower.y;

    // Bloom aura ring (drawn behind the tower).
    if (tower.type === 'bloom' && stats.auraRadius) {
      ctx.strokeStyle = 'rgba(68,221,136,0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, stats.auraRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Tower body.
    ctx.fillStyle = def.color;
    if (tower.type === 'bloom') {
      // Bloom: petal-like shape.
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const r = 14 + tower.level * 2;
        const pr = r * 0.55;
        ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        ctx.lineTo(x + Math.cos(a + Math.PI / 6) * pr, y + Math.sin(a + Math.PI / 6) * pr);
      }
      ctx.closePath();
      ctx.fill();
    } else if (tower.type === 'lance') {
      // Lance: tall diamond shape.
      ctx.beginPath();
      const r = 14 + tower.level * 2;
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r * 0.6, y);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r * 0.6, y);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 14 + tower.level * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lvl = tower.level + 1;
    ctx.fillText(lvl.toString(), x, y);

    // Muzzle flash.
    if (tower.flashTimer > 0) {
      const flashAlpha = tower.flashTimer / 0.12;
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      const flashLen = 22;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(tower.angle) * flashLen, y + Math.sin(tower.angle) * flashLen);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Barrel direction line.
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(tower.angle) * 18, y + Math.sin(tower.angle) * 18);
    ctx.stroke();
  }
}

export function drawEnemies(ctx, state) {
  for (const e of state.enemies) {
    if (!e.alive) continue;
    ctx.fillStyle = e.flashTimer > 0 ? '#fff' : e.color;

    if (e.type === 'splitter') {
      // Splitter: square-ish shape.
      ctx.beginPath();
      const r = e.radius;
      ctx.rect(e.x - r, e.y - r, r * 2, r * 2);
      ctx.fill();
      // Inner split line.
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y - r);
      ctx.lineTo(e.x, e.y + r);
      ctx.stroke();
    } else if (e.type === 'mender') {
      // Mender: triangle shape with a cross.
      ctx.beginPath();
      const r = e.radius;
      ctx.moveTo(e.x, e.y - r);
      ctx.lineTo(e.x + r, e.y + r);
      ctx.lineTo(e.x - r, e.y + r);
      ctx.closePath();
      ctx.fill();
      // Small cross.
      ctx.strokeStyle = '#aaffaa';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(e.x - 3, e.y);
      ctx.lineTo(e.x + 3, e.y);
      ctx.moveTo(e.x, e.y - 3);
      ctx.lineTo(e.x, e.y + 3);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (e.slowTimer > 0) {
      ctx.strokeStyle = '#66ddff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    const barW = e.radius * 2.5;
    const barH = 3;
    const bx = e.x - barW / 2;
    const by = e.y - e.radius - 6;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = e.hp / e.maxHp > 0.5 ? '#4a4' : e.hp / e.maxHp > 0.25 ? '#aa4' : '#a44';
    ctx.fillRect(bx, by, barW * (e.hp / e.maxHp), barH);
  }
}

export function drawProjectiles(ctx, state) {
  for (const p of state.projectiles) {
    if (!p.alive) continue;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();

    for (const ct of p.chainTargets) {
      ctx.strokeStyle = '#cc88ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ct.x1, ct.y1);
      ctx.lineTo(ct.x2, ct.y2);
      ctx.stroke();
    }
  }
}

export function drawEffects(ctx, fx) {
  for (const p of fx.particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const t of fx.floatingTexts) {
    const alpha = Math.max(0, t.life / t.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = t.color;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;

  for (const r of fx.rings) {
    const alpha = Math.max(0, r.life / r.maxLife);
    ctx.globalAlpha = alpha * 0.5;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function drawPlacementGhost(ctx, col, row, valid, type) {
  if (col < 0 || row < 0) return;
  const x = col * CELL, y = row * CELL;
  ctx.fillStyle = valid ? 'rgba(80,200,80,0.3)' : 'rgba(200,80,80,0.3)';
  ctx.fillRect(x, y, CELL, CELL);
  if (valid && type) {
    const def = TOWERS[type];
    ctx.fillStyle = def.color;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(x + CELL / 2, y + CELL / 2, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export function drawRangePreview(ctx, x, y, range) {
  ctx.strokeStyle = 'rgba(200,200,255,0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(x, y, range, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawSelectedTowerRange(ctx, tower) {
  const stats = getTowerStats(tower);
  ctx.strokeStyle = 'rgba(123,140,255,0.4)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 3]);
  ctx.beginPath();
  ctx.arc(tower.x, tower.y, stats.range, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}
