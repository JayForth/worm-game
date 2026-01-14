import * as planck from 'planck';
import { createPhysicsWorld } from './Physics';
import { Input } from './Input';
import { Camera } from '../camera/Camera';
import { Renderer } from '../rendering/Renderer';
import { Worm } from '../entities/Worm';
import { Level } from '../level/Level';
import { LevelData } from '../level/LevelData';
import { Editor } from '../editor/Editor';

export class Game {
  private canvas: HTMLCanvasElement;
  private world: planck.World;
  private input: Input;
  private camera: Camera;
  private renderer: Renderer;
  private worm: Worm;
  private level: Level;
  private editor: Editor | null = null;

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
    const physics = createPhysicsWorld();
    this.world = physics.world;

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
