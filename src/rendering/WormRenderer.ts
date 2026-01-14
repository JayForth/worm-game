import { Worm, DEFAULT_WORM_CONFIG } from '../entities/Worm';

export class WormRenderer {
  private time = 0;

  render(ctx: CanvasRenderingContext2D, worm: Worm): void {
    this.time += 0.05;

    const positions = worm.getSegmentPositions();
    if (positions.length < 2) return;

    // Calculate color based on stretch
    const baseColor = { r: 180, g: 120, b: 100 }; // Earthy brown-pink
    const stretchColor = { r: 220, g: 80, b: 80 }; // Red warning

    const r = Math.round(baseColor.r + (stretchColor.r - baseColor.r) * worm.stretchRatio);
    const g = Math.round(baseColor.g + (stretchColor.g - baseColor.g) * worm.stretchRatio);
    const b = Math.round(baseColor.b + (stretchColor.b - baseColor.b) * worm.stretchRatio);
    const wormColor = `rgb(${r}, ${g}, ${b})`;

    // Draw smooth tube using quadratic curves
    ctx.strokeStyle = wormColor;
    ctx.lineWidth = DEFAULT_WORM_CONFIG.segmentRadius * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(positions[0].x, positions[0].y);

    for (let i = 1; i < positions.length - 1; i++) {
      const curr = positions[i];
      const next = positions[i + 1];
      const midX = (curr.x + next.x) / 2;
      const midY = (curr.y + next.y) / 2;
      ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
    }

    const last = positions[positions.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();

    // Draw ends with hover glow
    this.drawWormEnd(ctx, positions[0], worm.hoverEnd === 'head', wormColor);
    this.drawWormEnd(ctx, last, worm.hoverEnd === 'tail', wormColor);
  }

  private drawWormEnd(
    ctx: CanvasRenderingContext2D,
    pos: { x: number; y: number },
    isHovered: boolean,
    wormColor: string
  ): void {
    const radius = 10;

    // Glow effect when hovered
    if (isHovered) {
      const glowGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius * 2);
      glowGradient.addColorStop(0, 'rgba(255, 255, 200, 0.6)');
      glowGradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // End circle
    ctx.fillStyle = wormColor;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Subtle highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(pos.x - 2, pos.y - 2, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}
