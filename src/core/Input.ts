import { Camera } from '../camera/Camera';

export interface MouseState {
  x: number;
  y: number;
  worldX: number;
  worldY: number;
  down: boolean;
  justPressed: boolean;
  justReleased: boolean;
}

export interface KeyState {
  pressed: Set<string>;
  justPressed: Set<string>;
  justReleased: Set<string>;
}

export class Input {
  mouse: MouseState = {
    x: 0,
    y: 0,
    worldX: 0,
    worldY: 0,
    down: false,
    justPressed: false,
    justReleased: false,
  };

  keys: KeyState = {
    pressed: new Set(),
    justPressed: new Set(),
    justReleased: new Set(),
  };

  private canvas: HTMLCanvasElement;
  private camera: Camera | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupEventListeners();
  }

  setCamera(camera: Camera): void {
    this.camera = camera;
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('mouseleave', this.onMouseLeave);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    this.mouse.x = (e.clientX - rect.left) * scaleX;
    this.mouse.y = (e.clientY - rect.top) * scaleY;

    if (this.camera) {
      const world = this.camera.screenToWorld(this.mouse.x, this.mouse.y);
      this.mouse.worldX = world.x;
      this.mouse.worldY = world.y;
    } else {
      this.mouse.worldX = this.mouse.x;
      this.mouse.worldY = this.mouse.y;
    }
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return; // Left click only
    this.mouse.down = true;
    this.mouse.justPressed = true;
  };

  private onMouseUp = (): void => {
    this.mouse.down = false;
    this.mouse.justReleased = true;
  };

  private onMouseLeave = (): void => {
    if (this.mouse.down) {
      this.mouse.justReleased = true;
    }
    this.mouse.down = false;
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    if (!this.keys.pressed.has(key)) {
      this.keys.justPressed.add(key);
    }
    this.keys.pressed.add(key);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    this.keys.pressed.delete(key);
    this.keys.justReleased.add(key);
  };

  // Call at end of frame to clear single-frame states
  endFrame(): void {
    this.mouse.justPressed = false;
    this.mouse.justReleased = false;
    this.keys.justPressed.clear();
    this.keys.justReleased.clear();
  }

  isKeyPressed(key: string): boolean {
    return this.keys.pressed.has(key.toLowerCase());
  }

  isKeyJustPressed(key: string): boolean {
    return this.keys.justPressed.has(key.toLowerCase());
  }

  isKeyJustReleased(key: string): boolean {
    return this.keys.justReleased.has(key.toLowerCase());
  }

  destroy(): void {
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('mouseleave', this.onMouseLeave);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
