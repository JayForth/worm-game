export type SurfaceType = 'normal' | 'slippery' | 'sticky';

export interface PlatformData {
  x: number;
  y: number;
  width: number;
  height: number;
  surface: SurfaceType;
  angle?: number; // Rotation in radians, defaults to 0
}

export interface GoalData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LevelData {
  name: string;
  width: number;
  height: number;
  platforms: PlatformData[];
  goal: GoalData;
  deathY: number;
  spawnX: number;
  spawnY: number;
  colors: {
    background: string;
    normal: string;
    normalBorder: string;
    slippery: string;
    slipperyBorder: string;
    sticky: string;
    stickyBorder: string;
    goal: string;
  };
}

// Friction values for each surface type
export const SURFACE_FRICTION: Record<SurfaceType, number> = {
  normal: 0.8,
  slippery: 0.15,
  sticky: 1.5,
};
