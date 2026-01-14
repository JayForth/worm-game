import * as planck from 'planck';

// Planck uses meters, we use pixels. This is the conversion factor.
// 30 pixels = 1 meter in physics world
export const PIXELS_PER_METER = 30;

export function toPhysics(pixels: number): number {
  return pixels / PIXELS_PER_METER;
}

export function toPixels(meters: number): number {
  return meters * PIXELS_PER_METER;
}

export function toPhysicsVec(x: number, y: number): planck.Vec2 {
  return planck.Vec2(x / PIXELS_PER_METER, y / PIXELS_PER_METER);
}

export function toPixelsVec(vec: planck.Vec2): { x: number; y: number } {
  return {
    x: vec.x * PIXELS_PER_METER,
    y: vec.y * PIXELS_PER_METER,
  };
}

// Collision categories
export const CATEGORY_PLATFORM = 0x0001;
export const CATEGORY_WORM = 0x0002;

export interface PhysicsWorld {
  world: planck.World;
  step: (dt: number) => void;
  setGravity: (magnitude: number) => void;
  setIterations: (velocity: number, position: number) => void;
}

export function createPhysicsWorld(): PhysicsWorld {
  const world = new planck.World({
    gravity: planck.Vec2(0, 10), // Positive Y is down in our coordinate system
  });

  let velocityIterations = 8;
  let positionIterations = 3;

  return {
    world,
    step: (dt: number) => {
      world.step(dt, velocityIterations, positionIterations);
    },
    setGravity: (magnitude: number) => {
      world.setGravity(planck.Vec2(0, magnitude));
    },
    setIterations: (velocity: number, position: number) => {
      velocityIterations = velocity;
      positionIterations = position;
    },
  };
}
