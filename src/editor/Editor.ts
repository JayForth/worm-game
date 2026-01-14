import { Level } from '../level/Level';
import { Worm } from '../entities/Worm';
import { Camera } from '../camera/Camera';
import { Input } from '../core/Input';
import { Platform, cycleSurfaceType, updatePlatformSurface } from '../entities/Platform';
import { PlatformData } from '../level/LevelData';
import { toPixelsVec } from '../core/Physics';

type EditorTool = 'select' | 'surface' | 'spawn';

interface DragState {
  platform: Platform;
  offsetX: number;
  offsetY: number;
  resizing: 'none' | 'left' | 'right' | 'top' | 'bottom' | 'corner';
}

export class Editor {
  private enabled = false;
  private currentTool: EditorTool = 'select';
  private selectedPlatform: Platform | null = null;
  private dragState: DragState | null = null;
  private hoverPlatform: Platform | null = null;

  constructor(
    private level: Level,
    private worm: Worm,
    private camera: Camera,
    private ctx: CanvasRenderingContext2D
  ) {
    this.setupUI();
  }

  private setupUI(): void {
    // Tool buttons
    document.getElementById('tool-select')?.addEventListener('click', () => this.setTool('select'));
    document.getElementById('tool-surface')?.addEventListener('click', () => this.setTool('surface'));
    document.getElementById('tool-spawn')?.addEventListener('click', () => this.setTool('spawn'));
    document.getElementById('tool-add')?.addEventListener('click', () => this.addPlatform());
    document.getElementById('tool-delete')?.addEventListener('click', () => this.deleteSelected());
    document.getElementById('tool-export')?.addEventListener('click', () => this.exportLevel());
  }

  setTool(tool: EditorTool): void {
    this.currentTool = tool;
    this.selectedPlatform = null;
    this.updateToolUI();
  }

  private updateToolUI(): void {
    const tools = ['select', 'surface', 'spawn'];
    for (const tool of tools) {
      const btn = document.getElementById(`tool-${tool}`);
      if (btn) {
        btn.classList.toggle('active', tool === this.currentTool);
      }
    }
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
    this.selectedPlatform = null;
    this.dragState = null;
  }

  handleInput(input: Input): void {
    if (!this.enabled) return;

    const worldX = input.mouse.worldX;
    const worldY = input.mouse.worldY;

    // Update hover
    this.hoverPlatform = this.getPlatformAt(worldX, worldY);

    switch (this.currentTool) {
      case 'select':
        this.handleSelectTool(input, worldX, worldY);
        break;
      case 'surface':
        this.handleSurfaceTool(input, worldX, worldY);
        break;
      case 'spawn':
        this.handleSpawnTool(input, worldX, worldY);
        break;
    }
  }

  private handleSelectTool(input: Input, worldX: number, worldY: number): void {
    if (input.mouse.justPressed) {
      const platform = this.getPlatformAt(worldX, worldY);
      if (platform) {
        this.selectedPlatform = platform;
        const pos = toPixelsVec(platform.body.getPosition());
        this.dragState = {
          platform,
          offsetX: worldX - pos.x,
          offsetY: worldY - pos.y,
          resizing: this.getResizeHandle(platform, worldX, worldY),
        };
      } else {
        this.selectedPlatform = null;
      }
    }

    if (input.mouse.down && this.dragState) {
      const { platform, offsetX, offsetY, resizing } = this.dragState;

      if (resizing === 'none') {
        // Move platform
        this.level.updatePlatformPosition(platform, worldX - offsetX, worldY - offsetY);
      } else {
        // Resize platform
        this.resizePlatform(platform, resizing, worldX, worldY);
      }
    }

    if (input.mouse.justReleased) {
      this.dragState = null;
    }
  }

  private handleSurfaceTool(input: Input, worldX: number, worldY: number): void {
    if (input.mouse.justPressed) {
      const platform = this.getPlatformAt(worldX, worldY);
      if (platform) {
        const newSurface = cycleSurfaceType(platform.data.surface);
        updatePlatformSurface(platform, newSurface);
      }
    }
  }

  private handleSpawnTool(input: Input, worldX: number, worldY: number): void {
    if (input.mouse.justPressed) {
      // Respawn worm at click location
      this.worm.checkpoint = { x: worldX, y: worldY };
      this.worm.respawn();
    }
  }

  private getPlatformAt(x: number, y: number): Platform | null {
    for (const platform of this.level.platforms) {
      const pos = toPixelsVec(platform.body.getPosition());
      const { width, height } = platform.data;

      if (
        x >= pos.x - width / 2 &&
        x <= pos.x + width / 2 &&
        y >= pos.y - height / 2 &&
        y <= pos.y + height / 2
      ) {
        return platform;
      }
    }
    return null;
  }

  private getResizeHandle(
    platform: Platform,
    x: number,
    y: number
  ): 'none' | 'left' | 'right' | 'top' | 'bottom' | 'corner' {
    const pos = toPixelsVec(platform.body.getPosition());
    const { width, height } = platform.data;
    const handleSize = 15;

    const left = pos.x - width / 2;
    const right = pos.x + width / 2;
    const top = pos.y - height / 2;
    const bottom = pos.y + height / 2;

    // Check corners first
    if (Math.abs(x - right) < handleSize && Math.abs(y - bottom) < handleSize) return 'corner';

    // Check edges
    if (Math.abs(x - left) < handleSize) return 'left';
    if (Math.abs(x - right) < handleSize) return 'right';
    if (Math.abs(y - top) < handleSize) return 'top';
    if (Math.abs(y - bottom) < handleSize) return 'bottom';

    return 'none';
  }

  private resizePlatform(
    platform: Platform,
    handle: 'left' | 'right' | 'top' | 'bottom' | 'corner',
    worldX: number,
    worldY: number
  ): void {
    const pos = toPixelsVec(platform.body.getPosition());
    let { width, height } = platform.data;
    let newX = pos.x;
    let newY = pos.y;

    const minSize = 40;

    switch (handle) {
      case 'right':
      case 'corner':
        width = Math.max(minSize, (worldX - pos.x) * 2);
        if (handle === 'corner') {
          height = Math.max(minSize, (worldY - pos.y) * 2);
        }
        break;
      case 'left':
        width = Math.max(minSize, (pos.x - worldX) * 2);
        break;
      case 'bottom':
        height = Math.max(minSize, (worldY - pos.y) * 2);
        break;
      case 'top':
        height = Math.max(minSize, (pos.y - worldY) * 2);
        break;
    }

    platform.data.width = width;
    platform.data.height = height;
    this.level.updatePlatformPosition(platform, newX, newY);
    this.level.updatePlatformSize(platform, width, height);
  }

  private addPlatform(): void {
    // Add platform at center of view
    const centerX = this.camera.x + this.ctx.canvas.width / 2;
    const centerY = this.camera.y + this.ctx.canvas.height / 2;

    const platformData: PlatformData = {
      x: centerX,
      y: centerY,
      width: 200,
      height: 40,
      surface: 'normal',
    };

    const platform = this.level.addPlatform(platformData);
    this.selectedPlatform = platform;
  }

  private deleteSelected(): void {
    if (this.selectedPlatform) {
      this.level.removePlatform(this.selectedPlatform);
      this.selectedPlatform = null;
    }
  }

  private exportLevel(): void {
    const data = this.level.exportData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `level-export-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  render(): void {
    if (!this.enabled) return;

    this.ctx.save();
    this.camera.applyTransform(this.ctx);

    // Highlight hovered platform
    if (this.hoverPlatform && this.hoverPlatform !== this.selectedPlatform) {
      this.drawPlatformHighlight(this.hoverPlatform, 'rgba(255, 255, 255, 0.2)');
    }

    // Highlight selected platform
    if (this.selectedPlatform) {
      this.drawPlatformHighlight(this.selectedPlatform, 'rgba(255, 255, 0, 0.3)');
      this.drawResizeHandles(this.selectedPlatform);
    }

    // Draw tool-specific overlays
    if (this.currentTool === 'spawn') {
      this.drawSpawnIndicator();
    }

    this.ctx.restore();

    // Draw editor mode indicator
    this.ctx.fillStyle = 'rgba(255, 200, 0, 0.8)';
    this.ctx.font = '14px sans-serif';
    this.ctx.fillText('EDITOR MODE (` to exit)', 10, 30);
    this.ctx.fillText(`Tool: ${this.currentTool.toUpperCase()}`, 10, 50);
  }

  private drawPlatformHighlight(platform: Platform, color: string): void {
    const pos = toPixelsVec(platform.body.getPosition());
    const { width, height } = platform.data;

    this.ctx.fillStyle = color;
    this.ctx.fillRect(pos.x - width / 2, pos.y - height / 2, width, height);
  }

  private drawResizeHandles(platform: Platform): void {
    const pos = toPixelsVec(platform.body.getPosition());
    const { width, height } = platform.data;
    const handleSize = 8;

    this.ctx.fillStyle = 'white';
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 1;

    // Corner handle (bottom-right)
    const cx = pos.x + width / 2;
    const cy = pos.y + height / 2;
    this.ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
    this.ctx.strokeRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);

    // Edge handles
    const edges = [
      { x: pos.x - width / 2, y: pos.y }, // left
      { x: pos.x + width / 2, y: pos.y }, // right
      { x: pos.x, y: pos.y - height / 2 }, // top
      { x: pos.x, y: pos.y + height / 2 }, // bottom
    ];

    for (const edge of edges) {
      this.ctx.fillRect(edge.x - handleSize / 2, edge.y - handleSize / 2, handleSize, handleSize);
      this.ctx.strokeRect(edge.x - handleSize / 2, edge.y - handleSize / 2, handleSize, handleSize);
    }
  }

  private drawSpawnIndicator(): void {
    // Draw crosshair at checkpoint
    const { x, y } = this.worm.checkpoint;
    this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.moveTo(x - 20, y);
    this.ctx.lineTo(x + 20, y);
    this.ctx.moveTo(x, y - 20);
    this.ctx.lineTo(x, y + 20);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(x, y, 10, 0, Math.PI * 2);
    this.ctx.stroke();
  }
}
