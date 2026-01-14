export class Camera {
  x = 0;
  y = 0;
  private targetX = 0;
  private targetY = 0;

  constructor(
    private canvasWidth: number,
    private canvasHeight: number,
    private levelWidth: number,
    private levelHeight: number,
    private smoothing = 0.08
  ) {}

  follow(targetX: number, targetY: number): void {
    // Set target to center on the target position
    this.targetX = targetX - this.canvasWidth / 2;
    this.targetY = targetY - this.canvasHeight / 2;

    // Clamp to level bounds
    this.targetX = Math.max(0, Math.min(this.targetX, this.levelWidth - this.canvasWidth));
    this.targetY = Math.max(0, Math.min(this.targetY, this.levelHeight - this.canvasHeight));

    // Smooth follow
    this.x += (this.targetX - this.x) * this.smoothing;
    this.y += (this.targetY - this.y) * this.smoothing;
  }

  applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.translate(-Math.round(this.x), -Math.round(this.y));
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX + this.x,
      y: screenY + this.y,
    };
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX - this.x,
      y: worldY - this.y,
    };
  }

  resize(canvasWidth: number, canvasHeight: number): void {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  setLevelBounds(levelWidth: number, levelHeight: number): void {
    this.levelWidth = levelWidth;
    this.levelHeight = levelHeight;
  }
}
