// WebAudio synth: shoot, hit, coin, leak, wave start, victory, defeat, UI clicks; ambient pad; mute.
let ctx = null;
let masterGain = null;
let muted = false;
let padOsc = null;
let padGain = null;

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function playTone(freq, duration, type, vol, detune) {
  if (muted || !ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  if (detune) osc.detune.value = detune;
  gain.gain.value = vol || 0.15;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, vol) {
  if (muted || !ctx) return;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = vol || 0.05;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  src.connect(gain);
  gain.connect(masterGain);
  src.start();
}

const SOUNDS = {
  shoot() { playTone(880, 0.08, 'square', 0.08); },
  hit() { playTone(440, 0.06, 'triangle', 0.1); playNoise(0.04, 0.03); },
  coin() { playTone(1200, 0.1, 'sine', 0.12); playTone(1600, 0.12, 'sine', 0.08); },
  leak() { playTone(180, 0.3, 'sawtooth', 0.15); playTone(120, 0.4, 'sine', 0.1); },
  waveStart() { playTone(600, 0.15, 'sine', 0.12); setTimeout(() => playTone(800, 0.2, 'sine', 0.1), 100); },
  victory() {
    playTone(523, 0.2, 'sine', 0.15);
    setTimeout(() => playTone(659, 0.2, 'sine', 0.15), 150);
    setTimeout(() => playTone(784, 0.3, 'sine', 0.15), 300);
    setTimeout(() => playTone(1047, 0.4, 'sine', 0.12), 500);
  },
  defeat() {
    playTone(400, 0.3, 'sawtooth', 0.12);
    setTimeout(() => playTone(300, 0.3, 'sawtooth', 0.1), 200);
    setTimeout(() => playTone(200, 0.5, 'sawtooth', 0.08), 400);
  },
  click() { playTone(1000, 0.04, 'sine', 0.08); },
  place() { playTone(660, 0.08, 'triangle', 0.1); playTone(880, 0.1, 'triangle', 0.08); },
  sell() { playTone(500, 0.06, 'triangle', 0.08); playTone(350, 0.08, 'triangle', 0.06); },
  upgrade() { playTone(700, 0.08, 'sine', 0.1); playTone(1050, 0.12, 'sine', 0.1); },
};

export function initAudio() {
  ensureCtx();
}

export function play(name) {
  ensureCtx();
  const fn = SOUNDS[name];
  if (fn) fn();
}

export function setMuted(m) {
  muted = m;
  if (padGain) padGain.gain.value = m ? 0 : 0.02;
}

export function isMuted() { return muted; }

export function startPad() {
  ensureCtx();
  if (padOsc) return;
  padOsc = ctx.createOscillator();
  padGain = ctx.createGain();
  padOsc.type = 'sine';
  padOsc.frequency.value = 110;
  padGain.gain.value = muted ? 0 : 0.02;
  padOsc.connect(padGain);
  padGain.connect(masterGain);
  padOsc.start();
}

export function stopPad() {
  if (padOsc) { padOsc.stop(); padOsc = null; padGain = null; }
}
