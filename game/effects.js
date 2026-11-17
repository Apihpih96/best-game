// Particles, floating text, screen shake, hit flashes.
export function createEffects() {
  return {
    particles: [],
    floatingTexts: [],
    rings: [],
    shakeTrauma: 0,
    shakeTime: 0,
  };
}

export function addHitParticles(fx, x, y, color) {
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 60;
    fx.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.3 + Math.random() * 0.2,
      maxLife: 0.5,
      color: color || '#ffcc44',
      size: 2 + Math.random() * 2,
    });
  }
}

export function addDeathParticles(fx, x, y, color) {
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 80;
    fx.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + Math.random() * 0.3,
      maxLife: 0.7,
      color: color || '#ff8844',
      size: 2 + Math.random() * 3,
    });
  }
}

export function addSplashRing(fx, x, y, radius, color) {
  fx.rings.push({ x, y, radius: 0, maxRadius: radius, life: 0.3, maxLife: 0.3, color });
}

export function addFloatingText(fx, x, y, text, color, duration) {
  fx.floatingTexts.push({ x, y, text, color: color || '#fff', life: duration || 0.8, maxLife: duration || 0.8 });
}

export function addShake(fx, trauma) {
  fx.shakeTrauma = Math.min(fx.shakeTrauma + trauma, 1.0);
}

export function updateEffects(fx, dt) {
  // Particles.
  for (let i = fx.particles.length - 1; i >= 0; i--) {
    const p = fx.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.life -= dt;
    if (p.life <= 0) fx.particles.splice(i, 1);
  }
  // Floating texts.
  for (let i = fx.floatingTexts.length - 1; i >= 0; i--) {
    const t = fx.floatingTexts[i];
    t.y -= 30 * dt;
    t.life -= dt;
    if (t.life <= 0) fx.floatingTexts.splice(i, 1);
  }
  // Rings.
  for (let i = fx.rings.length - 1; i >= 0; i--) {
    const r = fx.rings[i];
    r.life -= dt;
    r.radius = r.maxRadius * (1 - r.life / r.maxLife);
    if (r.life <= 0) fx.rings.splice(i, 1);
  }
  // Shake decay.
  if (fx.shakeTrauma > 0) {
    fx.shakeTrauma = Math.max(fx.shakeTrauma - 1.2 * dt, 0);
    fx.shakeTime += dt * 30;
  }
}

export function getShakeOffset(fx) {
  if (fx.shakeTrauma <= 0) return [0, 0];
  const s = fx.shakeTrauma * fx.shakeTrauma;
  return [
    Math.sin(fx.shakeTime * 1.7) * 8 * s,
    Math.sin(fx.shakeTime * 2.3) * 5 * s,
  ];
}
