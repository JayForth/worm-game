import * as planck from 'planck';
import { PlatformData, SurfaceType, SURFACE_FRICTION } from '../level/LevelData';
import { toPhysics, CATEGORY_PLATFORM, CATEGORY_WORM } from '../core/Physics';

export interface Platform {
  body: planck.Body;
  data: PlatformData;
}

export function createPlatform(world: planck.World, data: PlatformData): Platform {
  const body = world.createBody({
    type: 'static',
    position: planck.Vec2(toPhysics(data.x), toPhysics(data.y)),
    angle: data.angle ?? 0,
  });

  const halfWidth = toPhysics(data.width / 2);
  const halfHeight = toPhysics(data.height / 2);

  const fixture = body.createFixture({
    shape: planck.Box(halfWidth, halfHeight),
    friction: SURFACE_FRICTION[data.surface],
    restitution: 0,
    filterCategoryBits: CATEGORY_PLATFORM,
    filterMaskBits: CATEGORY_WORM,
  });

  // Store surface type in user data for rendering
  fixture.setUserData({ surface: data.surface });

  return { body, data };
}

export function getPlatformBounds(platform: Platform): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const { x, y, width, height } = platform.data;
  return {
    minX: x - width / 2,
    minY: y - height / 2,
    maxX: x + width / 2,
    maxY: y + height / 2,
  };
}

export function cycleSurfaceType(current: SurfaceType): SurfaceType {
  const order: SurfaceType[] = ['normal', 'slippery', 'sticky'];
  const index = order.indexOf(current);
  return order[(index + 1) % order.length];
}

export function updatePlatformSurface(platform: Platform, surface: SurfaceType): void {
  platform.data.surface = surface;

  // Update friction on the fixture
  const fixture = platform.body.getFixtureList();
  if (fixture) {
    fixture.setFriction(SURFACE_FRICTION[surface]);
    fixture.setUserData({ surface });
  }
}
