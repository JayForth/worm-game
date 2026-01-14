import { LevelData } from '../LevelData';

// Diagonal climb test level - 1-2 minute completion time
// Features: ledge sequences, steep ramps, mixed surfaces
export const TEST_LEVEL: LevelData = {
  name: 'Test Level',
  width: 3500,
  height: 2500,

  // Start at bottom-left, goal at top-right
  spawnX: 200,
  spawnY: 2200,

  deathY: 2600,

  goal: {
    x: 3200,
    y: 400,
    width: 100,
    height: 120,
  },

  platforms: [
    // === SECTION 1: Starting area ===
    // Wide starting platform
    { x: 300, y: 2300, width: 500, height: 40, surface: 'normal' },

    // First climb - gentle introduction
    { x: 650, y: 2200, width: 300, height: 40, surface: 'normal' },
    { x: 900, y: 2080, width: 280, height: 40, surface: 'normal' },

    // === SECTION 2: First ledge sequence ===
    { x: 1150, y: 1950, width: 250, height: 40, surface: 'normal' },
    { x: 1350, y: 1820, width: 220, height: 40, surface: 'normal' },
    { x: 1150, y: 1680, width: 240, height: 40, surface: 'normal' }, // Back left

    // Sticky safe zone after first challenge
    { x: 1400, y: 1550, width: 300, height: 40, surface: 'sticky' },

    // === SECTION 3: Minor branch (left path slightly easier) ===
    // Left path
    { x: 1200, y: 1400, width: 200, height: 40, surface: 'normal' },
    { x: 1050, y: 1260, width: 220, height: 40, surface: 'normal' },
    { x: 1250, y: 1120, width: 200, height: 40, surface: 'normal' },

    // Right path (slightly harder - has slippery section)
    { x: 1600, y: 1420, width: 180, height: 40, surface: 'normal' },
    { x: 1750, y: 1300, width: 200, height: 40, surface: 'slippery' },
    { x: 1550, y: 1150, width: 220, height: 40, surface: 'normal' },

    // Paths reconverge
    { x: 1400, y: 1000, width: 350, height: 40, surface: 'normal' },

    // === SECTION 4: Steep ramp challenge ===
    // Angled ramp that rejects fast approaches
    { x: 1700, y: 880, width: 300, height: 35, surface: 'slippery', angle: -0.4 },

    // Recovery platform after ramp
    { x: 1950, y: 780, width: 280, height: 40, surface: 'sticky' },

    // === SECTION 5: Vertical climb sequence ===
    { x: 2150, y: 680, width: 220, height: 40, surface: 'normal' },
    { x: 2350, y: 570, width: 200, height: 40, surface: 'normal' },
    { x: 2150, y: 460, width: 230, height: 40, surface: 'normal' },

    // Slippery challenge before final stretch
    { x: 2400, y: 380, width: 180, height: 40, surface: 'slippery' },

    // === SECTION 6: Final approach ===
    // Approach to goal with one more ramp
    { x: 2650, y: 480, width: 250, height: 35, surface: 'normal', angle: -0.3 },

    // Safe landing before goal
    { x: 2900, y: 420, width: 280, height: 40, surface: 'sticky' },

    // Goal platform
    { x: 3200, y: 480, width: 300, height: 40, surface: 'normal' },
  ],

  colors: {
    background: '#2d3a27', // Dark forest green
    normal: '#5c4033', // Brown wood
    normalBorder: '#3d2817',
    slippery: '#6ba3c9', // Ice blue
    slipperyBorder: '#4a7a9c',
    sticky: '#4a7a4a', // Mossy green
    stickyBorder: '#2d5a2d',
    goal: '#4ade80',
  },
};
