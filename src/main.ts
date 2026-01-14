import { Game } from './core/Game';
import { TEST_LEVEL } from './level/levels/test-level';

// Start game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  const game = new Game(canvas, TEST_LEVEL);
  game.start();
});
