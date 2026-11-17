import { TOWER_ORDER, TOWERS, CELL, BOARD_W, BOARD_H } from './config.js';
import { pixelToCell } from './board.js';
import { canBuild } from './board.js';
import { getTowerStats } from './towers.js';

export function initInput(canvas, state, handlers) {
  let mouseX = -1, mouseY = -1;

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    handlers.onMouseMove(mouseX, mouseY);
  });

  canvas.addEventListener('mouseleave', () => {
    mouseX = -1; mouseY = -1;
    handlers.onMouseMove(-1, -1);
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    if (px > BOARD_W) return;
    const [col, row] = pixelToCell(px, py);
    handlers.onCellClick(col, row);
  });

  document.addEventListener('keydown', (e) => {
    const key = e.key;
    if (key === 'Enter' && state.phase === 'title') { handlers.onStartGame(); return; }
    if (key === 'r' || key === 'R') {
      if (state.phase === 'victory' || state.phase === 'defeat') { handlers.onRestart(); return; }
    }
    if (key === 'p' || key === 'P') { handlers.onTogglePause(); return; }
    if (key === 'f' || key === 'F') { handlers.onToggleFast(); return; }
    if (key === 'm' || key === 'M') { handlers.onToggleMute(); return; }
    if (key === ' ') { e.preventDefault(); handlers.onStartWave(); return; }
    if (key === 'Escape') { handlers.onCancel(); return; }
    for (const type of TOWER_ORDER) {
      if (TOWERS[type].key === key) { handlers.onSelectCard(type); return; }
    }
  });

  return { getMouse: () => [mouseX, mouseY] };
}
