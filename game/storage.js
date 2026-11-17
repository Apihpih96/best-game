const KEY = 'glimmerhold_best';

export function loadBestScore() {
  try { return parseInt(localStorage.getItem(KEY), 10) || 0; } catch { return 0; }
}

export function saveBestScore(score) {
  try { if (score > loadBestScore()) localStorage.setItem(KEY, score); } catch {}
}
