// Debug configuration types and defaults

export interface PhysicsCoreConfig {
  gravityMagnitude: number;
  velocityIterations: number;
  positionIterations: number;
}

export interface WormShapeConfig {
  segmentCount: number;
  segmentRadius: number;
  segmentSpacing: number;
}

export interface WormPhysicsConfig {
  linearDamping: number;
  angularDamping: number;
  segmentDensity: number;
  segmentFriction: number;
  segmentRestitution: number;
}

export interface JointConfig {
  frequencyHz: number;
  dampingRatio: number;
}

export interface GrabThrowConfig {
  maxStretch: number;
  throwMultiplier: number;
  mouseDragFrequency: number;
  mouseDragDamping: number;
  hitboxMultiplier: number;
}

export interface CameraConfig {
  smoothing: number;
}

export interface VisualDebugConfig {
  showGrabZones: boolean;
  showPhysicsBodies: boolean;
  showJoints: boolean;
  showVelocityVectors: boolean;
  showGroundedState: boolean;
}

export interface DebugConfig {
  physicsCore: PhysicsCoreConfig;
  wormShape: WormShapeConfig;
  wormPhysics: WormPhysicsConfig;
  joints: JointConfig;
  grabThrow: GrabThrowConfig;
  camera: CameraConfig;
  visualDebug: VisualDebugConfig;
}

export interface ParamMeta {
  label: string;
  min: number;
  max: number;
  step: number;
  requiresRebuild?: boolean;
  unit?: string;
}

export const PARAM_METADATA: Record<string, Record<string, ParamMeta>> = {
  physicsCore: {
    gravityMagnitude: { label: 'Gravity', min: 0, max: 50, step: 0.5, unit: 'm/s²' },
    velocityIterations: { label: 'Velocity Iterations', min: 1, max: 20, step: 1 },
    positionIterations: { label: 'Position Iterations', min: 1, max: 10, step: 1 },
  },
  wormShape: {
    segmentCount: { label: 'Segment Count', min: 4, max: 50, step: 1, requiresRebuild: true },
    segmentRadius: { label: 'Segment Radius', min: 2, max: 20, step: 1, unit: 'px' },
    segmentSpacing: { label: 'Segment Spacing', min: 4, max: 30, step: 1, unit: 'px', requiresRebuild: true },
  },
  wormPhysics: {
    linearDamping: { label: 'Linear Damping', min: 0, max: 2, step: 0.05 },
    angularDamping: { label: 'Angular Damping', min: 0, max: 2, step: 0.05 },
    segmentDensity: { label: 'Density', min: 0.1, max: 10, step: 0.1 },
    segmentFriction: { label: 'Friction', min: 0, max: 2, step: 0.05 },
    segmentRestitution: { label: 'Restitution (Bounce)', min: 0, max: 1, step: 0.05 },
  },
  joints: {
    frequencyHz: { label: 'Stiffness (Hz)', min: 0.5, max: 20, step: 0.5 },
    dampingRatio: { label: 'Damping Ratio', min: 0, max: 1, step: 0.05 },
  },
  grabThrow: {
    maxStretch: { label: 'Max Stretch', min: 100, max: 600, step: 10, unit: 'px' },
    throwMultiplier: { label: 'Throw Power', min: 1, max: 15, step: 0.5 },
    mouseDragFrequency: { label: 'Drag Stiffness (Hz)', min: 1, max: 15, step: 0.5 },
    mouseDragDamping: { label: 'Drag Damping', min: 0, max: 1, step: 0.05 },
    hitboxMultiplier: { label: 'Grab Zone Size', min: 1, max: 6, step: 0.5 },
  },
  camera: {
    smoothing: { label: 'Camera Smoothing', min: 0.01, max: 0.3, step: 0.01 },
  },
};

export const SECTION_LABELS: Record<string, string> = {
  physicsCore: 'Physics Core',
  wormShape: 'Worm Shape',
  wormPhysics: 'Worm Physics',
  joints: 'Joint Properties',
  grabThrow: 'Grab & Throw',
  camera: 'Camera',
  visualDebug: 'Visual Debug',
};

export const DEFAULT_DEBUG_CONFIG: DebugConfig = {
  physicsCore: {
    gravityMagnitude: 10,
    velocityIterations: 8,
    positionIterations: 3,
  },
  wormShape: {
    segmentCount: 24,
    segmentRadius: 8,
    segmentSpacing: 12,
  },
  wormPhysics: {
    linearDamping: 0.1,
    angularDamping: 0.1,
    segmentDensity: 2.0,
    segmentFriction: 0.8,
    segmentRestitution: 0,
  },
  joints: {
    frequencyHz: 8.0,
    dampingRatio: 0.7,
  },
  grabThrow: {
    maxStretch: 350,
    throwMultiplier: 6,
    mouseDragFrequency: 5.0,
    mouseDragDamping: 0.7,
    hitboxMultiplier: 3.0,
  },
  camera: {
    smoothing: 0.08,
  },
  visualDebug: {
    showGrabZones: false,
    showPhysicsBodies: false,
    showJoints: false,
    showVelocityVectors: false,
    showGroundedState: false,
  },
};

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
