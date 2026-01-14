import { LevelData, GoalData, SurfaceType } from '../level/LevelData';
import { Platform } from '../entities/Platform';
import { toPixelsVec } from '../core/Physics';

export class LevelRenderer {
  private time = 0;

  constructor(private level: LevelData) {}

  setLevel(level: LevelData): void {
    this.level = level;
  }

  renderBackground(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.level.colors.background;
    ctx.fillRect(0, 0, ctx.canvas.width * 2, ctx.canvas.height * 2);
  }

  renderPlatforms(ctx: CanvasRenderingContext2D, platforms: Platform[]): void {
    for (const platform of platforms) {
      const { surface } = platform.data;
      const colors = this.getSurfaceColors(surface);

      const pos = toPixelsVec(platform.body.getPosition());
      const angle = platform.body.getAngle();
      const { width, height } = platform.data;

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(angle);

      // Fill
      ctx.fillStyle = colors.fill;
      ctx.fillRect(-width / 2, -height / 2, width, height);

      // Border
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 3;
      ctx.strokeRect(-width / 2, -height / 2, width, height);

      // Surface type indicator pattern
      if (surface === 'slippery') {
        this.drawSlipperyPattern(ctx, width, height);
      } else if (surface === 'sticky') {
        this.drawStickyPattern(ctx, width, height);
      }

      ctx.restore();
    }
  }

  private getSurfaceColors(surface: SurfaceType): { fill: string; border: string } {
    switch (surface) {
      case 'slippery':
        return {
          fill: this.level.colors.slippery,
          border: this.level.colors.slipperyBorder,
        };
      case 'sticky':
        return {
          fill: this.level.colors.sticky,
          border: this.level.colors.stickyBorder,
        };
      default:
        return {
          fill: this.level.colors.normal,
          border: this.level.colors.normalBorder,
        };
    }
  }

  private drawSlipperyPattern(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Draw diagonal lines to indicate ice/slippery
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    const spacing = 15;
    for (let x = -width / 2 - height; x < width / 2 + height; x += spacing) {
      ctx.moveTo(x, -height / 2);
      ctx.lineTo(x + height, height / 2);
    }
    ctx.stroke();
  }

  private drawStickyPattern(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Draw dots to indicate sticky/mossy texture
    ctx.fillStyle = 'rgba(0, 100, 0, 0.3)';
    const spacing = 12;

    for (let x = -width / 2 + spacing / 2; x < width / 2; x += spacing) {
      for (let y = -height / 2 + spacing / 2; y < height / 2; y += spacing) {
        ctx.beginPath();
        ctx.arc(x + (Math.random() - 0.5) * 4, y + (Math.random() - 0.5) * 4, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  renderGoal(ctx: CanvasRenderingContext2D, goal: GoalData): void {
    this.time += 0.05;

    // Pulsing glow effect
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 2);
    const glowSize = 10 + pulse * 8;

    // Outer glow
    const gradient = ctx.createRadialGradient(goal.x, goal.y, 0, goal.x, goal.y, goal.width + glowSize);
    gradient.addColorStop(0, `rgba(74, 222, 128, ${0.3 + pulse * 0.2})`);
    gradient.addColorStop(1, 'rgba(74, 222, 128, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(goal.x, goal.y, goal.width + glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Goal zone
    ctx.fillStyle = `rgba(74, 222, 128, ${0.4 + pulse * 0.2})`;
    ctx.fillRect(goal.x - goal.width / 2, goal.y - goal.height / 2, goal.width, goal.height);

    // Border
    ctx.strokeStyle = this.level.colors.goal;
    ctx.lineWidth = 2;
    ctx.strokeRect(goal.x - goal.width / 2, goal.y - goal.height / 2, goal.width, goal.height);
  }
}
