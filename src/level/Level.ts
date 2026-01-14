import * as planck from 'planck';
import { LevelData, PlatformData, SURFACE_FRICTION } from './LevelData';
import { Platform, createPlatform } from '../entities/Platform';

export class Level {
  platforms: Platform[] = [];
  data: LevelData;

  constructor(
    private world: planck.World,
    data: LevelData
  ) {
    this.data = data;
    this.createPlatforms();
  }

  private createPlatforms(): void {
    for (const platformData of this.data.platforms) {
      const platform = createPlatform(this.world, platformData);
      this.platforms.push(platform);
    }
  }

  getPlatformBodies(): planck.Body[] {
    return this.platforms.map((p) => p.body);
  }

  addPlatform(platformData: PlatformData): Platform {
    const platform = createPlatform(this.world, platformData);
    this.platforms.push(platform);
    this.data.platforms.push(platformData);
    return platform;
  }

  removePlatform(platform: Platform): void {
    const index = this.platforms.indexOf(platform);
    if (index !== -1) {
      this.world.destroyBody(platform.body);
      this.platforms.splice(index, 1);
      this.data.platforms.splice(index, 1);
    }
  }

  updatePlatformPosition(platform: Platform, x: number, y: number): void {
    platform.data.x = x;
    platform.data.y = y;
    platform.body.setPosition(planck.Vec2(x / 30, y / 30)); // Using PIXELS_PER_METER
  }

  updatePlatformSize(platform: Platform, width: number, height: number): void {
    // To resize, we need to destroy and recreate the fixture
    const fixture = platform.body.getFixtureList();
    if (fixture) {
      platform.body.destroyFixture(fixture);
    }

    platform.data.width = width;
    platform.data.height = height;

    platform.body.createFixture({
      shape: planck.Box(width / 60, height / 60), // half-width, half-height in meters
      friction: SURFACE_FRICTION[platform.data.surface],
      restitution: 0,
      filterCategoryBits: 0x0001, // CATEGORY_PLATFORM
      filterMaskBits: 0x0002, // CATEGORY_WORM
    });
  }

  exportData(): LevelData {
    return JSON.parse(JSON.stringify(this.data));
  }

  destroy(): void {
    for (const platform of this.platforms) {
      this.world.destroyBody(platform.body);
    }
    this.platforms = [];
  }
}
