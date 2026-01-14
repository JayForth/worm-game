import { Camera } from '../camera/Camera';
import { LevelData, GoalData } from '../level/LevelData';
import { Platform } from '../entities/Platform';
import { Worm } from '../entities/Worm';
import { LevelRenderer } from './LevelRenderer';
import { WormRenderer } from './WormRenderer';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private levelRenderer: LevelRenderer;
  private wormRenderer: WormRenderer;

  constructor(
    canvas: HTMLCanvasElement,
    level: LevelData
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');
    this.ctx = ctx;

    this.levelRenderer = new LevelRenderer(level);
    this.wormRenderer = new WormRenderer();
  }

  setLevel(level: LevelData): void {
    this.levelRenderer.setLevel(level);
  }

  render(worm: Worm, platforms: Platform[], goal: GoalData, camera: Camera): void {
    // Clear with background
    this.ctx.save();
    this.levelRenderer.renderBackground(this.ctx);
    this.ctx.restore();

    // Apply camera transform
    this.ctx.save();
    camera.applyTransform(this.ctx);

    // Draw world
    this.levelRenderer.renderPlatforms(this.ctx, platforms);
    this.levelRenderer.renderGoal(this.ctx, goal);
    this.wormRenderer.render(this.ctx, worm);

    this.ctx.restore();
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}
