import { Worm } from '../entities/Worm';
import { VisualDebugConfig, DebugConfig } from './DebugConfig';
import { toPixelsVec } from '../core/Physics';

export class DebugRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    worm: Worm,
    visualConfig: VisualDebugConfig,
    debugConfig: DebugConfig
  ): void {
    if (visualConfig.showGrabZones) {
      this.renderGrabZones(ctx, worm, debugConfig);
    }
    if (visualConfig.showPhysicsBodies) {
      this.renderPhysicsBodies(ctx, worm, debugConfig);
    }
    if (visualConfig.showJoints) {
      this.renderJoints(ctx, worm);
    }
    if (visualConfig.showVelocityVectors) {
      this.renderVelocityVectors(ctx, worm);
    }
    if (visualConfig.showGroundedState) {
      this.renderGroundedState(ctx, worm, debugConfig);
    }
  }

  private renderGrabZones(
    ctx: CanvasRenderingContext2D,
    worm: Worm,
    debugConfig: DebugConfig
  ): void {
    const positions = worm.getSegmentPositions();
    if (positions.length < 2) return;

    const headPos = positions[0];
    const tailPos = positions[positions.length - 1];
    const hitRadius = debugConfig.wormShape.segmentRadius * debugConfig.grabThrow.hitboxMultiplier;

    ctx.save();
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
    ctx.fillStyle = 'rgba(100, 200, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    // Head grab zone
    ctx.beginPath();
    ctx.arc(headPos.x, headPos.y, hitRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tail grab zone
    ctx.beginPath();
    ctx.arc(tailPos.x, tailPos.y, hitRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Labels
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(100, 200, 255, 0.9)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HEAD', headPos.x, headPos.y - hitRadius - 5);
    ctx.fillText('TAIL', tailPos.x, tailPos.y - hitRadius - 5);

    ctx.restore();
  }

  private renderPhysicsBodies(
    ctx: CanvasRenderingContext2D,
    worm: Worm,
    debugConfig: DebugConfig
  ): void {
    const positions = worm.getSegmentPositions();
    const radius = debugConfig.wormShape.segmentRadius;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.7)';
    ctx.fillStyle = 'rgba(255, 200, 100, 0.2)';
    ctx.lineWidth = 1;

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Show segment index
      ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i), pos.x, pos.y);
      ctx.fillStyle = 'rgba(255, 200, 100, 0.2)';
    }

    ctx.restore();
  }

  private renderJoints(ctx: CanvasRenderingContext2D, worm: Worm): void {
    const joints = worm.getJoints();

    ctx.save();
    ctx.strokeStyle = 'rgba(150, 255, 150, 0.6)';
    ctx.lineWidth = 2;

    for (const joint of joints) {
      const bodyA = joint.getBodyA();
      const bodyB = joint.getBodyB();

      const posA = toPixelsVec(bodyA.getPosition());
      const posB = toPixelsVec(bodyB.getPosition());

      ctx.beginPath();
      ctx.moveTo(posA.x, posA.y);
      ctx.lineTo(posB.x, posB.y);
      ctx.stroke();

      // Draw joint anchor points
      ctx.fillStyle = 'rgba(150, 255, 150, 0.8)';
      ctx.beginPath();
      ctx.arc(posA.x, posA.y, 3, 0, Math.PI * 2);
      ctx.arc(posB.x, posB.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderVelocityVectors(ctx: CanvasRenderingContext2D, worm: Worm): void {
    const positions = worm.getSegmentPositions();
    const velocities = worm.getSegmentVelocities();

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)';
    ctx.fillStyle = 'rgba(255, 100, 100, 0.7)';
    ctx.lineWidth = 2;

    const scale = 0.05; // Scale down velocity for visualization

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const vel = velocities[i];

      const endX = pos.x + vel.x * scale;
      const endY = pos.y + vel.y * scale;

      const speed = Math.hypot(vel.x, vel.y);
      if (speed < 10) continue; // Skip very small velocities

      // Draw line
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Draw arrowhead
      const angle = Math.atan2(vel.y, vel.x);
      const arrowSize = 6;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(angle - Math.PI / 6),
        endY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        endX - arrowSize * Math.cos(angle + Math.PI / 6),
        endY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  private renderGroundedState(
    ctx: CanvasRenderingContext2D,
    worm: Worm,
    debugConfig: DebugConfig
  ): void {
    const positions = worm.getSegmentPositions();
    if (positions.length < 2) return;

    const headPos = positions[0];
    const tailPos = positions[positions.length - 1];
    const radius = debugConfig.wormShape.segmentRadius;

    // We'll use a simple visual indicator - this doesn't check actual grounded state
    // Just shows where grounded checks would be made
    ctx.save();
    ctx.strokeStyle = 'rgba(200, 100, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    // Draw check area under head
    ctx.beginPath();
    ctx.moveTo(headPos.x - radius * 2, headPos.y + radius);
    ctx.lineTo(headPos.x + radius * 2, headPos.y + radius);
    ctx.lineTo(headPos.x + radius * 2, headPos.y + radius + 10);
    ctx.lineTo(headPos.x - radius * 2, headPos.y + radius + 10);
    ctx.closePath();
    ctx.stroke();

    // Draw check area under tail
    ctx.beginPath();
    ctx.moveTo(tailPos.x - radius * 2, tailPos.y + radius);
    ctx.lineTo(tailPos.x + radius * 2, tailPos.y + radius);
    ctx.lineTo(tailPos.x + radius * 2, tailPos.y + radius + 10);
    ctx.lineTo(tailPos.x - radius * 2, tailPos.y + radius + 10);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  hasActiveVisuals(config: VisualDebugConfig): boolean {
    return (
      config.showGrabZones ||
      config.showPhysicsBodies ||
      config.showJoints ||
      config.showVelocityVectors ||
      config.showGroundedState
    );
  }
}
