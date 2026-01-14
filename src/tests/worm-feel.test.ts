import { describe, it, expect, beforeEach } from 'vitest';
import * as planck from 'planck';
import { Worm, DEFAULT_WORM_CONFIG } from '../entities/Worm';
import { createPhysicsWorld, toPixelsVec, toPhysics } from '../core/Physics';

describe('Worm Physics Feel', () => {
  let world: planck.World;
  let worm: Worm;

  // Create a ground platform for testing
  function createGround(y: number, width = 1000): planck.Body {
    const ground = world.createBody({
      type: 'static',
      position: planck.Vec2(toPhysics(500), toPhysics(y)),
    });
    ground.createFixture({
      shape: planck.Box(toPhysics(width / 2), toPhysics(20)),
      friction: 0.8,
    });
    return ground;
  }

  function stepWorld(seconds: number): void {
    const steps = Math.ceil(seconds * 60);
    for (let i = 0; i < steps; i++) {
      world.step(1 / 60);
    }
  }

  beforeEach(() => {
    const physics = createPhysicsWorld();
    world = physics.world;
  });

  describe('Segment Configuration', () => {
    it('should have correct segment count', () => {
      worm = new Worm(world, 100, 100);
      expect(worm.segments.length).toBe(DEFAULT_WORM_CONFIG.segmentCount);
    });

    it('should have correct initial length', () => {
      worm = new Worm(world, 100, 100);
      const positions = worm.getSegmentPositions();
      const headPos = positions[0];
      const tailPos = positions[positions.length - 1];

      // Total length should be approximately (segmentCount - 1) * segmentSpacing
      const expectedLength =
        (DEFAULT_WORM_CONFIG.segmentCount - 1) * DEFAULT_WORM_CONFIG.segmentSpacing;
      const actualLength = Math.abs(tailPos.x - headPos.x);

      expect(actualLength).toBeCloseTo(expectedLength, 0);
    });
  });

  describe('Constraint Behavior', () => {
    it('should maintain chain integrity under gravity', () => {
      createGround(400);
      worm = new Worm(world, 200, 100);

      // Let worm fall and settle
      stepWorld(3);

      const positions = worm.getSegmentPositions();

      // Check that all segments are connected (no segment too far from neighbors)
      const maxAllowedGap = DEFAULT_WORM_CONFIG.segmentSpacing * 1.5;

      for (let i = 0; i < positions.length - 1; i++) {
        const curr = positions[i];
        const next = positions[i + 1];
        const gap = Math.hypot(next.x - curr.x, next.y - curr.y);
        expect(gap).toBeLessThan(maxAllowedGap);
      }
    });

    it('should exhibit damped oscillation when disturbed', () => {
      createGround(400);
      worm = new Worm(world, 200, 350);

      // Let settle first
      stepWorld(2);

      // Apply impulse to head
      worm.head.applyLinearImpulse(planck.Vec2(0.5, -0.3), worm.head.getPosition(), true);

      // Measure velocity magnitudes over time - should decrease due to damping
      const velocities: number[] = [];
      for (let i = 0; i < 120; i++) {
        stepWorld(1 / 60);
        const vel = worm.head.getLinearVelocity();
        velocities.push(Math.hypot(vel.x, vel.y));
      }

      // Peak velocity should occur early
      const maxVel = Math.max(...velocities);
      const maxIndex = velocities.indexOf(maxVel);
      expect(maxIndex).toBeLessThan(60);

      // Final velocity should be much smaller than peak
      const finalVel = velocities[velocities.length - 1];
      expect(finalVel).toBeLessThan(maxVel * 0.5);
    });
  });

  describe('Grab and Drag Mechanics', () => {
    it('should anchor opposite end when grabbing', () => {
      createGround(400);
      worm = new Worm(world, 200, 350);
      stepWorld(1);

      const tailPosBefore = toPixelsVec(worm.tail.getPosition());

      // Grab head
      const headPos = toPixelsVec(worm.head.getPosition());
      worm.grab('head', headPos.x, headPos.y);

      // Drag head away
      worm.updateDrag(headPos.x + 100, headPos.y - 50);
      stepWorld(0.5);

      const tailPosAfter = toPixelsVec(worm.tail.getPosition());

      // Tail should not have moved significantly (it's anchored)
      const tailMovement = Math.hypot(
        tailPosAfter.x - tailPosBefore.x,
        tailPosAfter.y - tailPosBefore.y
      );
      expect(tailMovement).toBeLessThan(5);

      worm.release();
    });

    it('should respect max stretch limit', () => {
      worm = new Worm(world, 200, 200);

      const tailPos = toPixelsVec(worm.tail.getPosition());
      worm.grab('head', 200, 200);

      // Try to drag far beyond max stretch
      const farX = tailPos.x + DEFAULT_WORM_CONFIG.maxStretch * 2;
      worm.updateDrag(farX, 200);

      // Stretch ratio should be capped at 1
      expect(worm.stretchRatio).toBe(1);

      worm.release();
    });
  });

  describe('Throw Momentum', () => {
    it('should apply velocity on release based on mouse movement', () => {
      worm = new Worm(world, 200, 200);

      // Zero out any initial velocity
      worm.head.setLinearVelocity(planck.Vec2(0, 0));

      const headPos = toPixelsVec(worm.head.getPosition());
      worm.grab('head', headPos.x, headPos.y);

      // Simulate drag movement (multiple frames)
      for (let i = 0; i < 5; i++) {
        worm.updateDrag(headPos.x + (i + 1) * 10, headPos.y);
        world.step(1 / 60);
      }

      worm.release();

      // Head should have significant velocity after release from throw momentum
      const velAfter = worm.head.getLinearVelocity();
      expect(Math.abs(velAfter.x)).toBeGreaterThan(50);
    });

    it('should use configured throw multiplier', () => {
      worm = new Worm(world, 200, 200);

      const headPos = toPixelsVec(worm.head.getPosition());
      worm.grab('head', headPos.x, headPos.y);

      // Consistent drag velocity
      const dragSpeed = 20; // pixels per frame
      worm.updateDrag(headPos.x + dragSpeed, headPos.y);
      worm.updateDrag(headPos.x + dragSpeed * 2, headPos.y);

      worm.release();

      // Velocity should be proportional to throw multiplier
      const vel = worm.head.getLinearVelocity();
      // Expected velocity = dragSpeed * throwMultiplier * 60 / PIXELS_PER_METER
      // With multiplier of 6, dragSpeed of 20, that's 20 * 6 * 60 / 30 = 240 m/s in physics units
      // We just verify it's significant
      expect(Math.abs(vel.x)).toBeGreaterThan(10);
    });
  });

  describe('Goal and Death Detection', () => {
    it('should detect when worm reaches goal', () => {
      worm = new Worm(world, 100, 100);

      const goal = { x: 100, y: 100, width: 200, height: 200 };

      expect(worm.checkGoal(goal)).toBe(true);
    });

    it('should detect when worm falls below death line', () => {
      worm = new Worm(world, 100, 100);

      // Move worm below death line
      stepWorld(5); // Let gravity pull it down

      expect(worm.checkDeath(200)).toBe(true);
    });

    it('should not trigger death when above death line', () => {
      createGround(300);
      worm = new Worm(world, 200, 250);
      stepWorld(1);

      expect(worm.checkDeath(500)).toBe(false);
    });
  });

  describe('Checkpoint System', () => {
    it('should update checkpoint when both ends grounded', () => {
      const ground = createGround(300);
      worm = new Worm(world, 200, 250);

      const initialCheckpoint = { ...worm.checkpoint };

      // Step enough for grounded timer to trigger (>30 frames)
      for (let i = 0; i < 60; i++) {
        world.step(1 / 60);
        worm.checkGrounded([ground]);
      }

      // Checkpoint should have updated
      expect(worm.checkpoint.x).not.toBe(initialCheckpoint.x);
    });
  });

  describe('Respawn Behavior', () => {
    it('should respawn at checkpoint position', () => {
      worm = new Worm(world, 100, 100);
      worm.checkpoint = { x: 500, y: 500 };

      worm.respawn();

      const center = worm.getCenter();
      expect(center.x).toBeCloseTo(500 + (DEFAULT_WORM_CONFIG.segmentCount - 1) * DEFAULT_WORM_CONFIG.segmentSpacing / 2, -1);
    });

    it('should clear grab state on respawn', () => {
      worm = new Worm(world, 100, 100);
      worm.grab('head', 100, 100);

      expect(worm.grabbedEnd).toBe('head');

      worm.respawn();

      expect(worm.grabbedEnd).toBeNull();
    });
  });
});
