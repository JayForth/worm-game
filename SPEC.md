# Worm Game - Elevated Prototype Specification

## Overview

Transform the existing worm physics prototype into a polished "Getting Over It"-inspired experience with improved physics, strategic level design, and developer tooling.

**Target Experience:** 1-2 minute test levels with diagonal climbing progression, where reckless slinging is punished by physics-based terrain, encouraging a hybrid of careful movement and calculated throws.

---

## Technical Architecture

### Physics Engine Migration

**From:** Matter.js
**To:** Planck.js (Box2D port)

**Rationale:** Better slope/curve collision handling, more accurate constraint physics for the worm segments.

**Critical Requirement:** The worm's "feel" must match the current implementation exactly. The existing parameters are:
- Segment count: 24
- Segment radius: 8px
- Segment spacing: 12px (~288px total length)
- Constraint stiffness: 0.9
- Constraint damping: 0.1
- Segment friction: 0.8
- Segment friction static: 1.0
- Segment restitution: 0 (no bounce)
- Segment density: 0.002

### Codebase Approach

**Strategy:** Fresh rewrite designed around Planck.js idioms

**Language:** TypeScript with strict configuration:
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Recommended File Structure

```
src/
├── core/
│   ├── Game.ts           # Main game loop, state management
│   ├── Physics.ts        # Planck.js world setup and utilities
│   └── Input.ts          # Mouse/keyboard handling
├── entities/
│   ├── Worm.ts           # Worm physics body, grab/drag/throw
│   └── Platform.ts       # Platform with surface properties
├── level/
│   ├── Level.ts          # Level data structure and loading
│   ├── LevelData.ts      # Type definitions for level format
│   └── levels/
│       └── test-level.json
├── rendering/
│   ├── Renderer.ts       # Canvas 2D rendering coordinator
│   ├── WormRenderer.ts   # Worm-specific drawing
│   └── LevelRenderer.ts  # Platforms, surfaces, goal
├── camera/
│   └── Camera.ts         # Smooth follow camera
├── editor/
│   ├── Editor.ts         # Dev mode editor controller
│   ├── PlatformTool.ts   # Drag/resize platforms
│   ├── SurfaceTool.ts    # Paint surface types
│   └── TestTool.ts       # Spawn worm at click location
├── tests/
│   └── worm-feel.test.ts # Automated physics feel verification
└── main.ts               # Entry point
```

---

## Core Mechanics

### Worm Movement

**Hybrid Approach:** Slinging is viable for small gaps but level geometry punishes reckless long throws.

**Throw Momentum:** Reduce multiplier from 8x to **5-6x** to make slinging less dominant while still rewarding precise throws.

**Anchoring Behavior:**
- When grabbing one end, the opposite end becomes static (current behavior)
- Anchoring works on all surface types, but friction determines stability
- On slippery surfaces: reduced friction, worm may slide but can still anchor if stationary

### Checkpoint System

**Trigger:** Both ends grounded on any stable surface for ~0.5 seconds (current behavior)

**Visibility:** Invisible - player learns spawn point through dying

**Respawn Options:**
1. Automatic respawn when falling below death zone (current)
2. **NEW:** Manual "Respawn to Checkpoint" button - allows recovery without dying

### Recovery

Add a dedicated respawn button (e.g., "R" key or UI button) that returns the worm to the last checkpoint. This addresses situations where the worm gets stuck in awkward positions without requiring death.

---

## Surface Types

### Normal (80% of level)
- Default friction values
- Standard anchor behavior
- Visual: Current platform appearance

### Slippery (10% of level)
- Reduced friction coefficient (0.2-0.3)
- Worm slides more when landing
- Anchoring still works but less stable
- Visual: Distinct color (e.g., ice blue, glossy appearance)

### Sticky (10% of level)
- Increased friction coefficient (1.5+)
- Worm grips extra well
- Safe zones for difficult sections
- Visual: Distinct color (e.g., mossy green, textured appearance)

**Visual Requirement:** Surface types must be clearly distinguishable before the worm touches them.

---

## Level Design

### Geometry Philosophy

**Primary Challenge Elements:**
1. **Ledge Sequences** - Staggered platforms requiring multiple anchor points to climb
2. **Steep Ramps** - High-angle slopes that reject fast impacts via pure physics (angle + low friction = slide off)

**Avoid:** Tight spaces, narrow passages - the current worm length should feel comfortable throughout

### Path Structure

- **Overall Shape:** Diagonal climb (upward and rightward progression)
- **Routing:** Single primary path with occasional minor branches that reconverge
- **Landing Zones:** Generous - platforms should easily fit the full worm length

### Anti-Sling Design

The level should make "throw to the end" impossible through:
1. Upward progression preventing momentum-based shortcuts
2. Steep ramps that reject thrown worms (slide back down)
3. Ledge sequences requiring deliberate anchor placement
4. Strategic placement of slippery surfaces after potential throw targets

### Test Level Specifications

- **Duration:** 1-2 minutes to complete
- **Dimensions:** ~4000px horizontal, ~2000px vertical rise
- **Platform Count:** 15-25 platforms
- **Surface Distribution:** 80% normal, 10% slippery, 10% sticky
- **Win Condition:** Reach goal zone (no scoring/timing)

---

## Camera

**Behavior:** Keep current implementation
- Smooth follow with 0.08 smoothing factor
- Centers on worm's center point
- Clamped to level bounds

---

## User Interface

### In-Game UI

- **Restart Button:** Top-right corner (current)
- **Respawn Button:** NEW - Returns to checkpoint without dying
- **Tutorial Text:** "Click and drag a worm end to move" (fades after first interaction)
- **Win Message:** "Level Complete!" with Play Again button

### Feedback Systems

**Keep Minimal:**
- Stretch indicator: Worm color shifts from earthy brown-pink to red as stretch approaches max
- Hover glow on worm ends
- Cursor changes (default → grab → grabbing)

**Not Included:**
- Audio (skip for this phase)
- Screen shake
- Particles
- UI meters/indicators

---

## Level Editor (Dev Mode)

### Access

Toggle with keyboard shortcut (e.g., backtick `` ` `` or F1) - enters edit mode in-game

### Tools

1. **Platform Tool**
   - Click and drag to move platforms
   - Drag edges/corners to resize
   - Right-click to delete

2. **Surface Tool**
   - Click platform to cycle surface type: Normal → Slippery → Sticky → Normal
   - Visual feedback shows current type

3. **Test Spawn Tool**
   - Click anywhere to spawn worm at that location
   - Useful for testing specific sections

4. **Add Platform**
   - Button or keyboard shortcut to add new platform at screen center

### Data Export

- **Export Button:** Downloads current level as JSON file
- **Format:** Matches `LevelData.ts` type definitions
- **Filename:** `level-export-{timestamp}.json`

### Editor UI

- Tool selection buttons/hotkeys
- Current tool indicator
- Export button
- "Exit Editor" button

---

## Platform Support

**Target:** Desktop only (mouse-based controls)

No touch/mobile considerations for this phase.

---

## Automated Testing

### Worm Feel Verification

Create automated tests that verify physics behavior matches the original Matter.js implementation:

```typescript
// Example test cases
describe('Worm Physics Feel', () => {
  test('segment chain maintains expected length under gravity', () => {
    // Spawn worm, let settle, verify total length within tolerance
  });

  test('constraint stiffness produces expected oscillation decay', () => {
    // Displace one end, measure oscillation damping rate
  });

  test('throw momentum produces expected velocity', () => {
    // Simulate grab, drag, release sequence
    // Verify released end velocity matches expected multiplier
  });

  test('anchored end remains static during drag', () => {
    // Grab one end, verify opposite end position unchanged
  });

  test('friction values produce expected slide behavior', () => {
    // Drop worm on angled surface, measure slide distance
  });
});
```

### Test Infrastructure

- Use Vitest or Jest with Planck.js
- Run physics simulation in headless mode
- Compare numerical results against recorded baselines from Matter.js version

---

## Implementation Phases

### Phase 1: Physics Migration
- Set up Planck.js with TypeScript
- Recreate worm with matched physics feel
- Implement grab/drag/throw mechanics
- Run automated tests to verify feel

### Phase 2: Surface System
- Add surface type property to platforms
- Implement friction variations
- Add visual distinction for surface types

### Phase 3: Level Design
- Design test level with diagonal climb
- Implement ledge sequences and steep ramps
- Place strategic surface types
- Tune difficulty through playtesting

### Phase 4: Editor
- Implement dev mode toggle
- Add platform manipulation tools
- Add surface painting
- Add test spawn functionality
- Implement JSON export

### Phase 5: Polish
- Add manual respawn button
- Final physics tuning
- Level iteration based on playtesting

---

## Dependencies

```json
{
  "dependencies": {
    "planck": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

---

## Success Criteria

1. Worm feels identical to current Matter.js implementation (verified by automated tests)
2. Slinging to the end is impossible due to level geometry
3. Level is completable in 1-2 minutes with practice
4. Hybrid movement (careful + calculated throws) is the optimal strategy
5. Editor allows rapid level iteration
6. Code is well-structured TypeScript with clear separation of concerns

---

## Out of Scope (This Phase)

- Audio/music
- Multiple levels
- Scoring/timing systems
- Mobile/touch support
- Save/load game progress
- Visual polish beyond surface type distinction
- Particles or screen effects
