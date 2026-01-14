import * as planck from 'planck';
import {
  toPhysics,
  toPixels,
  toPhysicsVec,
  toPixelsVec,
  CATEGORY_WORM,
  CATEGORY_PLATFORM,
} from '../core/Physics';

export interface WormConfig {
  segmentCount: number;
  segmentRadius: number;
  segmentSpacing: number;
  maxStretch: number;
  throwMultiplier: number;
}

export const DEFAULT_WORM_CONFIG: WormConfig = {
  segmentCount: 24,
  segmentRadius: 8,
  segmentSpacing: 12,
  maxStretch: 350,
  throwMultiplier: 6, // Reduced from 8 per spec
};

export type WormEnd = 'head' | 'tail';

export class Worm {
  private world: planck.World;
  private config: WormConfig;

  segments: planck.Body[] = [];
  joints: planck.Joint[] = [];

  // Grab state
  grabbedEnd: WormEnd | null = null;
  private mouseJoint: planck.MouseJoint | null = null;
  private anchoredBody: planck.Body | null = null;
  private groundBody: planck.Body;

  // Mouse tracking for momentum
  private lastMousePos = { x: 0, y: 0 };
  private mouseVelocity = { x: 0, y: 0 };

  // Configurable mouse joint parameters
  private mouseJointFrequency = 5.0;
  private mouseJointDamping = 0.7;

  // Configurable hitbox multiplier
  hitboxMultiplier = 3.0;

  // Checkpoint
  checkpoint: { x: number; y: number };
  private groundedTimer = 0;

  // Visual state
  stretchRatio = 0;
  hoverEnd: WormEnd | null = null;

  constructor(world: planck.World, x: number, y: number, config = DEFAULT_WORM_CONFIG) {
    this.world = world;
    this.config = config;
    this.checkpoint = { x, y };

    // Create a static ground body for mouse joint anchor
    this.groundBody = world.createBody({
      type: 'static',
      position: planck.Vec2(0, 0),
    });

    this.createBody(x, y);
  }

  private createBody(x: number, y: number): void {
    const { segmentCount, segmentRadius, segmentSpacing } = this.config;

    // Create segments
    for (let i = 0; i < segmentCount; i++) {
      const segX = x + i * segmentSpacing;
      const body = this.world.createBody({
        type: 'dynamic',
        position: toPhysicsVec(segX, y),
        fixedRotation: false,
        linearDamping: 0.1,
        angularDamping: 0.1,
      });

      body.createFixture({
        shape: planck.Circle(toPhysics(segmentRadius)),
        friction: 0.8,
        restitution: 0,
        density: 2.0, // Adjusted for Planck's unit system
        filterCategoryBits: CATEGORY_WORM,
        filterMaskBits: CATEGORY_PLATFORM,
      });

      // Store index for identification
      body.setUserData({ wormIndex: i });
      this.segments.push(body);
    }

    // Connect segments with distance joints
    // Planck doesn't have the same stiffness/damping model as Matter.js
    // We use distance joints with frequencyHz and dampingRatio to approximate
    for (let i = 0; i < segmentCount - 1; i++) {
      const joint = this.world.createJoint(
        planck.DistanceJoint({
          bodyA: this.segments[i],
          bodyB: this.segments[i + 1],
          localAnchorA: planck.Vec2(0, 0),
          localAnchorB: planck.Vec2(0, 0),
          length: toPhysics(segmentSpacing),
          // These values tuned to match Matter.js feel
          // frequencyHz controls stiffness (higher = stiffer)
          // dampingRatio controls damping (0-1, 1 = critical damping)
          frequencyHz: 8.0,
          dampingRatio: 0.7,
        })
      );
      if (joint) this.joints.push(joint);
    }
  }

  get head(): planck.Body {
    return this.segments[0];
  }

  get tail(): planck.Body {
    return this.segments[this.segments.length - 1];
  }

  getEndBody(end: WormEnd): planck.Body {
    return end === 'head' ? this.head : this.tail;
  }

  getEndAtPosition(x: number, y: number, hitboxMultiplierOverride?: number): WormEnd | null {
    const hitRadius = this.config.segmentRadius * (hitboxMultiplierOverride ?? this.hitboxMultiplier);

    const headPos = toPixelsVec(this.head.getPosition());
    const tailPos = toPixelsVec(this.tail.getPosition());

    const headDist = Math.hypot(x - headPos.x, y - headPos.y);
    const tailDist = Math.hypot(x - tailPos.x, y - tailPos.y);

    if (headDist < hitRadius) return 'head';
    if (tailDist < hitRadius) return 'tail';
    return null;
  }

  updateHover(mouseX: number, mouseY: number): void {
    this.hoverEnd = this.getEndAtPosition(mouseX, mouseY);
  }

  grab(end: WormEnd, mouseX: number, mouseY: number): boolean {
    if (this.grabbedEnd) return false;

    const grabbedBody = this.getEndBody(end);
    const anchoredBody = this.getEndBody(end === 'head' ? 'tail' : 'head');

    this.grabbedEnd = end;
    this.anchoredBody = anchoredBody;

    // Make anchored end static
    anchoredBody.setType('static');

    // Create mouse joint for dragging
    this.mouseJoint = this.world.createJoint(
      planck.MouseJoint({
        bodyA: this.groundBody,
        bodyB: grabbedBody,
        target: toPhysicsVec(mouseX, mouseY),
        maxForce: 1000 * grabbedBody.getMass(),
        frequencyHz: this.mouseJointFrequency,
        dampingRatio: this.mouseJointDamping,
      })
    ) as planck.MouseJoint;

    this.lastMousePos = { x: mouseX, y: mouseY };
    return true;
  }

  updateDrag(mouseX: number, mouseY: number): void {
    if (!this.grabbedEnd || !this.mouseJoint || !this.anchoredBody) return;

    // Calculate mouse velocity for momentum throw
    this.mouseVelocity = {
      x: mouseX - this.lastMousePos.x,
      y: mouseY - this.lastMousePos.y,
    };
    this.lastMousePos = { x: mouseX, y: mouseY };

    // Check stretch limit
    const anchorPos = toPixelsVec(this.anchoredBody.getPosition());
    const distance = Math.hypot(mouseX - anchorPos.x, mouseY - anchorPos.y);

    this.stretchRatio = Math.min(distance / this.config.maxStretch, 1);

    let targetX = mouseX;
    let targetY = mouseY;

    if (distance > this.config.maxStretch) {
      // Clamp to max stretch
      const dx = mouseX - anchorPos.x;
      const dy = mouseY - anchorPos.y;
      const scale = this.config.maxStretch / distance;
      targetX = anchorPos.x + dx * scale;
      targetY = anchorPos.y + dy * scale;
    }

    this.mouseJoint.setTarget(toPhysicsVec(targetX, targetY));
  }

  release(): void {
    if (!this.grabbedEnd) return;

    const grabbedBody = this.getEndBody(this.grabbedEnd);

    // Remove mouse joint
    if (this.mouseJoint) {
      this.world.destroyJoint(this.mouseJoint);
      this.mouseJoint = null;
    }

    // Unfreeze anchored body
    if (this.anchoredBody) {
      this.anchoredBody.setType('dynamic');
    }

    // Apply momentum from mouse velocity
    const throwVel = planck.Vec2(
      toPhysics(this.mouseVelocity.x * this.config.throwMultiplier * 60), // Scale for physics
      toPhysics(this.mouseVelocity.y * this.config.throwMultiplier * 60)
    );
    grabbedBody.setLinearVelocity(throwVel);

    this.grabbedEnd = null;
    this.anchoredBody = null;
    this.stretchRatio = 0;
  }

  checkGrounded(platforms: planck.Body[]): { headGrounded: boolean; tailGrounded: boolean } {
    const checkEnd = (body: planck.Body): boolean => {
      const pos = toPixelsVec(body.getPosition());
      const r = this.config.segmentRadius;

      for (const platform of platforms) {
        const pPos = toPixelsVec(platform.getPosition());
        const fixture = platform.getFixtureList();
        if (!fixture) continue;

        const shape = fixture.getShape();
        if (shape.getType() !== 'polygon') continue;

        // Get platform dimensions from AABB
        const aabb = fixture.getAABB(0);
        const halfW = toPixels(aabb.upperBound.x - aabb.lowerBound.x) / 2;
        const halfH = toPixels(aabb.upperBound.y - aabb.lowerBound.y) / 2;

        // Check if body is resting on top of platform
        if (
          pos.x >= pPos.x - halfW - r &&
          pos.x <= pPos.x + halfW + r &&
          pos.y >= pPos.y - halfH - r - 5 &&
          pos.y <= pPos.y - halfH + 5
        ) {
          return true;
        }
      }
      return false;
    };

    const headGrounded = checkEnd(this.head);
    const tailGrounded = checkEnd(this.tail);

    // Update checkpoint if both ends grounded
    if (headGrounded && tailGrounded && !this.grabbedEnd) {
      this.groundedTimer++;
      if (this.groundedTimer > 30) {
        const headPos = toPixelsVec(this.head.getPosition());
        const tailPos = toPixelsVec(this.tail.getPosition());
        this.checkpoint = {
          x: (headPos.x + tailPos.x) / 2,
          y: Math.min(headPos.y, tailPos.y) - 50,
        };
      }
    } else {
      this.groundedTimer = 0;
    }

    return { headGrounded, tailGrounded };
  }

  checkDeath(deathY: number): boolean {
    for (const segment of this.segments) {
      const pos = toPixelsVec(segment.getPosition());
      if (pos.y > deathY) {
        return true;
      }
    }
    return false;
  }

  checkGoal(goal: { x: number; y: number; width: number; height: number }): boolean {
    for (const segment of this.segments) {
      const pos = toPixelsVec(segment.getPosition());
      if (
        pos.x >= goal.x - goal.width / 2 &&
        pos.x <= goal.x + goal.width / 2 &&
        pos.y >= goal.y - goal.height / 2 &&
        pos.y <= goal.y + goal.height / 2
      ) {
        return true;
      }
    }
    return false;
  }

  getCenter(): { x: number; y: number } {
    let sumX = 0;
    let sumY = 0;
    for (const segment of this.segments) {
      const pos = toPixelsVec(segment.getPosition());
      sumX += pos.x;
      sumY += pos.y;
    }
    return {
      x: sumX / this.segments.length,
      y: sumY / this.segments.length,
    };
  }

  getSegmentPositions(): { x: number; y: number }[] {
    return this.segments.map((seg) => toPixelsVec(seg.getPosition()));
  }

  respawn(): void {
    // Release any grab first
    if (this.mouseJoint) {
      this.world.destroyJoint(this.mouseJoint);
      this.mouseJoint = null;
    }

    // Reset grab state
    this.grabbedEnd = null;
    this.anchoredBody = null;
    this.stretchRatio = 0;

    // Destroy current segments and joints
    for (const joint of this.joints) {
      this.world.destroyJoint(joint);
    }
    for (const segment of this.segments) {
      this.world.destroyBody(segment);
    }

    this.segments = [];
    this.joints = [];

    // Recreate at checkpoint
    this.createBody(this.checkpoint.x, this.checkpoint.y);
  }

  // Debug: Get config
  getConfig(): WormConfig {
    return this.config;
  }

  // Debug: Get joints for rendering
  getJoints(): planck.Joint[] {
    return this.joints;
  }

  // Debug: Get segment velocities
  getSegmentVelocities(): { x: number; y: number }[] {
    return this.segments.map((seg) => toPixelsVec(seg.getLinearVelocity()));
  }

  // Debug: Update segment physics properties (live)
  updateSegmentPhysics(
    damping: { linear: number; angular: number },
    fixture: { density: number; friction: number; restitution: number }
  ): void {
    for (const segment of this.segments) {
      segment.setLinearDamping(damping.linear);
      segment.setAngularDamping(damping.angular);

      const f = segment.getFixtureList();
      if (f) {
        f.setDensity(fixture.density);
        f.setFriction(fixture.friction);
        f.setRestitution(fixture.restitution);
        segment.resetMassData();
      }
    }
  }

  // Debug: Update joint properties (live)
  updateJointProperties(frequencyHz: number, dampingRatio: number): void {
    for (const joint of this.joints) {
      const distJoint = joint as planck.DistanceJoint;
      if (distJoint.setFrequency) {
        distJoint.setFrequency(frequencyHz);
      }
      if (distJoint.setDampingRatio) {
        distJoint.setDampingRatio(dampingRatio);
      }
    }
  }

  // Debug: Update grab/throw config
  updateGrabConfig(maxStretch: number, throwMultiplier: number): void {
    this.config.maxStretch = maxStretch;
    this.config.throwMultiplier = throwMultiplier;
  }

  // Debug: Update mouse joint config
  updateMouseJointConfig(frequencyHz: number, dampingRatio: number): void {
    this.mouseJointFrequency = frequencyHz;
    this.mouseJointDamping = dampingRatio;
  }

  // Debug: Update segment radius (live)
  updateSegmentRadius(radius: number): void {
    this.config.segmentRadius = radius;
    // Note: Changing fixture shape requires recreation, which we do on rebuild
  }

  // Debug: Rebuild worm with new shape config
  rebuild(newConfig: Partial<WormConfig>): void {
    // Merge new config
    this.config = { ...this.config, ...newConfig };

    // Store checkpoint
    const checkpoint = this.checkpoint;

    // Release any grab first
    if (this.mouseJoint) {
      this.world.destroyJoint(this.mouseJoint);
      this.mouseJoint = null;
    }

    // Reset grab state
    this.grabbedEnd = null;
    this.anchoredBody = null;
    this.stretchRatio = 0;

    // Destroy current segments and joints
    for (const joint of this.joints) {
      this.world.destroyJoint(joint);
    }
    for (const segment of this.segments) {
      this.world.destroyBody(segment);
    }

    this.segments = [];
    this.joints = [];

    // Recreate at checkpoint
    this.createBody(checkpoint.x, checkpoint.y);
  }

  destroy(): void {
    if (this.mouseJoint) {
      this.world.destroyJoint(this.mouseJoint);
    }
    for (const joint of this.joints) {
      this.world.destroyJoint(joint);
    }
    for (const segment of this.segments) {
      this.world.destroyBody(segment);
    }
    this.world.destroyBody(this.groundBody);
  }
}
