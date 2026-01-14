import * as planck from 'planck';
import { createPhysicsWorld, PhysicsWorld } from './Physics';
import { Input } from './Input';
import { Camera } from '../camera/Camera';
import { Renderer } from '../rendering/Renderer';
import { Worm } from '../entities/Worm';
import { Level } from '../level/Level';
import { LevelData } from '../level/LevelData';
import { Editor } from '../editor/Editor';
import { DebugPanel, DebugRenderer, DebugConfig } from '../debug';

export class Game {
  private canvas: HTMLCanvasElement;
  private physics: PhysicsWorld;
  private world: planck.World;
  private input: Input;
  private camera: Camera;
  private renderer: Renderer;
  private worm: Worm;
  private level: Level;
  private editor: Editor | null = null;

  // Debug
  private debugPanel: DebugPanel;
  private debugRenderer: DebugRenderer;

  private isWon = false;
  private hasInteracted = false;
  private editorEnabled = false;

  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedDt = 1 / 60;

  constructor(canvas: HTMLCanvasElement, levelData: LevelData) {
    this.canvas = canvas;
    canvas.width = 1280;
    canvas.height = 720;

    // Physics
    this.physics = createPhysicsWorld();
    this.world = this.physics.world;

    // Level
    this.level = new Level(this.world, levelData);

    // Worm
    this.worm = new Worm(this.world, levelData.spawnX, levelData.spawnY);

    // Camera
    this.camera = new Camera(canvas.width, canvas.height, levelData.width, levelData.height);

    // Input
    this.input = new Input(canvas);
    this.input.setCamera(this.camera);

    // Renderer
    this.renderer = new Renderer(canvas, levelData);

    // Debug
    this.debugRenderer = new DebugRenderer();
    this.debugPanel = new DebugPanel(
      (config, changedPath) => this.applyDebugConfig(config, changedPath),
      () => this.rebuildWorm()
    );

    // Apply initial debug config (from localStorage if saved)
    this.applyDebugConfig(this.debugPanel.getConfig(), 'all');

    // UI
    this.setupUI();
  }

  private setupUI(): void {
    const restartBtn = document.getElementById('restart-btn');
    restartBtn?.addEventListener('click', () => this.restart());

    const playAgainBtn = document.getElementById('play-again');
    playAgainBtn?.addEventListener('click', () => this.restart());

    const respawnBtn = document.getElementById('respawn-btn');
    respawnBtn?.addEventListener('click', () => this.respawnToCheckpoint());
  }

  private fadeTutorial(): void {
    const tutorial = document.getElementById('tutorial');
    if (tutorial) {
      tutorial.style.opacity = '0';
      setTimeout(() => {
        tutorial.style.display = 'none';
      }, 500);
    }
  }

  private showWin(): void {
    this.isWon = true;
    const winMessage = document.getElementById('win-message');
    if (winMessage) {
      winMessage.style.display = 'block';
    }
  }

  private restart(): void {
    const winMessage = document.getElementById('win-message');
    if (winMessage) {
      winMessage.style.display = 'none';
    }

    this.isWon = false;
    this.worm.respawn();

    // Reset checkpoint to spawn
    this.worm.checkpoint = {
      x: this.level.data.spawnX,
      y: this.level.data.spawnY,
    };
  }

  private respawnToCheckpoint(): void {
    if (!this.isWon) {
      this.worm.respawn();
    }
  }

  private handleInput(): void {
    // Toggle editor with backtick
    if (this.input.isKeyJustPressed('`')) {
      this.toggleEditor();
    }

    // Toggle debug panel with D
    if (this.input.isKeyJustPressed('d')) {
      this.debugPanel.toggle();
    }

    // Respawn with R
    if (this.input.isKeyJustPressed('r')) {
      this.respawnToCheckpoint();
    }

    // Editor handles its own input when active
    if (this.editorEnabled && this.editor) {
      this.editor.handleInput(this.input);
      return;
    }

    // Game input
    if (this.isWon) return;

    // Update hover state
    if (!this.worm.grabbedEnd) {
      this.worm.updateHover(this.input.mouse.worldX, this.input.mouse.worldY);
      this.canvas.style.cursor = this.worm.hoverEnd ? 'grab' : 'default';
    }

    // Grab on mouse down
    if (this.input.mouse.justPressed) {
      const end = this.worm.getEndAtPosition(this.input.mouse.worldX, this.input.mouse.worldY);
      if (end) {
        this.worm.grab(end, this.input.mouse.worldX, this.input.mouse.worldY);
        this.canvas.style.cursor = 'grabbing';

        if (!this.hasInteracted) {
          this.hasInteracted = true;
          this.fadeTutorial();
        }
      }
    }

    // Update drag
    if (this.input.mouse.down && this.worm.grabbedEnd) {
      this.worm.updateDrag(this.input.mouse.worldX, this.input.mouse.worldY);
    }

    // Release on mouse up
    if (this.input.mouse.justReleased && this.worm.grabbedEnd) {
      this.worm.release();
      this.canvas.style.cursor = this.worm.hoverEnd ? 'grab' : 'default';
    }
  }

  private toggleEditor(): void {
    this.editorEnabled = !this.editorEnabled;

    if (this.editorEnabled) {
      if (!this.editor) {
        this.editor = new Editor(this.level, this.worm, this.camera, this.renderer.getContext());
      }
      this.editor.enable();
    } else if (this.editor) {
      this.editor.disable();
    }

    // Show/hide editor UI
    const editorUI = document.getElementById('editor-ui');
    if (editorUI) {
      editorUI.style.display = this.editorEnabled ? 'block' : 'none';
    }
  }

  private applyDebugConfig(config: DebugConfig, changedPath: string): void {
    const isAll = changedPath === 'all';
    const [section] = changedPath.split('.');

    // Physics core
    if (isAll || section === 'physicsCore') {
      this.physics.setGravity(config.physicsCore.gravityMagnitude);
      this.physics.setIterations(
        config.physicsCore.velocityIterations,
        config.physicsCore.positionIterations
      );
    }

    // Worm physics (live update)
    if (isAll || section === 'wormPhysics') {
      this.worm.updateSegmentPhysics(
        {
          linear: config.wormPhysics.linearDamping,
          angular: config.wormPhysics.angularDamping,
        },
        {
          density: config.wormPhysics.segmentDensity,
          friction: config.wormPhysics.segmentFriction,
          restitution: config.wormPhysics.segmentRestitution,
        }
      );
    }

    // Joints (live update)
    if (isAll || section === 'joints') {
      this.worm.updateJointProperties(config.joints.frequencyHz, config.joints.dampingRatio);
    }

    // Grab/throw config
    if (isAll || section === 'grabThrow') {
      this.worm.updateGrabConfig(config.grabThrow.maxStretch, config.grabThrow.throwMultiplier);
      this.worm.updateMouseJointConfig(
        config.grabThrow.mouseDragFrequency,
        config.grabThrow.mouseDragDamping
      );
      this.worm.hitboxMultiplier = config.grabThrow.hitboxMultiplier;
    }

    // Camera
    if (isAll || section === 'camera') {
      this.camera.setSmoothing(config.camera.smoothing);
    }

    // Worm shape - only update radius live, count/spacing require rebuild
    if (isAll || section === 'wormShape') {
      this.worm.updateSegmentRadius(config.wormShape.segmentRadius);
    }
  }

  private rebuildWorm(): void {
    const config = this.debugPanel.getConfig();
    this.worm.rebuild({
      segmentCount: config.wormShape.segmentCount,
      segmentRadius: config.wormShape.segmentRadius,
      segmentSpacing: config.wormShape.segmentSpacing,
    });

    // Re-apply all physics settings to new segments
    this.applyDebugConfig(config, 'wormPhysics');
    this.applyDebugConfig(config, 'joints');
  }

  private update(): void {
    if (this.isWon) return;
    if (this.editorEnabled) return;

    // Check grounded state and update checkpoint
    this.worm.checkGrounded(this.level.getPlatformBodies());

    // Check death
    if (this.worm.checkDeath(this.level.data.deathY)) {
      this.worm.respawn();
    }

    // Check win
    if (this.worm.checkGoal(this.level.data.goal)) {
      this.showWin();
    }

    // Update camera to follow worm center
    const center = this.worm.getCenter();
    this.camera.follow(center.x, center.y);
  }

  private render(): void {
    this.renderer.render(this.worm, this.level.platforms, this.level.data.goal, this.camera);

    // Render debug overlay if any visuals are enabled
    const debugConfig = this.debugPanel.getConfig();
    if (this.debugRenderer.hasActiveVisuals(debugConfig.visualDebug)) {
      const ctx = this.renderer.getContext();
      ctx.save();
      this.camera.applyTransform(ctx);
      this.debugRenderer.render(ctx, this.worm, debugConfig.visualDebug, debugConfig);
      ctx.restore();
    }

    // Render editor overlay if active
    if (this.editorEnabled && this.editor) {
      this.editor.render();
    }
  }

  start(): void {
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private gameLoop = (): void => {
    const currentTime = performance.now();
    const frameTime = Math.min((currentTime - this.lastTime) / 1000, 0.25);
    this.lastTime = currentTime;

    this.accumulator += frameTime;

    // Handle input
    this.handleInput();

    // Fixed timestep physics
    while (this.accumulator >= this.fixedDt) {
      this.world.step(this.fixedDt);
      this.update();
      this.accumulator -= this.fixedDt;
    }

    // Render
    this.render();

    // Clear single-frame input states
    this.input.endFrame();

    requestAnimationFrame(this.gameLoop);
  };

  destroy(): void {
    this.input.destroy();
    this.worm.destroy();
    this.level.destroy();
  }
}
