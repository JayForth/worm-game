import {
  DebugConfig,
  DEFAULT_DEBUG_CONFIG,
  PARAM_METADATA,
  SECTION_LABELS,
  ParamMeta,
  deepClone,
} from './DebugConfig';
import { injectDebugStyles } from './DebugStyles';

const STORAGE_KEY = 'worm-game-debug-config';

export type ConfigChangeCallback = (config: DebugConfig, changedPath: string) => void;
export type RebuildCallback = () => void;

export class DebugPanel {
  private container: HTMLElement;
  private config: DebugConfig;
  private onConfigChange: ConfigChangeCallback;
  private onRebuild: RebuildCallback;
  private rebuildBtn: HTMLButtonElement | null = null;

  constructor(onConfigChange: ConfigChangeCallback, onRebuild: RebuildCallback) {
    injectDebugStyles();
    this.config = this.loadFromStorage() ?? deepClone(DEFAULT_DEBUG_CONFIG);
    this.onConfigChange = onConfigChange;
    this.onRebuild = onRebuild;
    this.container = this.createContainer();
    this.buildUI();
    this.hide();
  }

  toggle(): void {
    if (this.container.classList.contains('debug-hidden')) {
      this.show();
    } else {
      this.hide();
    }
  }

  show(): void {
    this.container.classList.remove('debug-hidden');
  }

  hide(): void {
    this.container.classList.add('debug-hidden');
  }

  isVisible(): boolean {
    return !this.container.classList.contains('debug-hidden');
  }

  getConfig(): DebugConfig {
    return this.config;
  }

  private createContainer(): HTMLElement {
    const existing = document.getElementById('debug-panel');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'debug-panel';
    document.body.appendChild(container);
    return container;
  }

  private buildUI(): void {
    this.container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.className = 'debug-header';
    header.innerHTML = `
      <span class="debug-title">Debug Panel</span>
      <div class="debug-header-buttons">
        <button class="debug-btn" id="debug-export">Export</button>
        <button class="debug-btn" id="debug-import">Import</button>
        <button class="debug-btn debug-close" id="debug-close">&times;</button>
      </div>
    `;
    this.container.appendChild(header);

    // Setup header button handlers
    header.querySelector('#debug-close')?.addEventListener('click', () => this.hide());
    header.querySelector('#debug-export')?.addEventListener('click', () => this.exportSettings());
    header.querySelector('#debug-import')?.addEventListener('click', () => this.importSettings());

    // Create sections for numeric parameters
    const numericSections = ['physicsCore', 'wormShape', 'wormPhysics', 'joints', 'grabThrow', 'camera'];
    for (const sectionKey of numericSections) {
      const section = this.createSection(sectionKey);
      this.container.appendChild(section);
    }

    // Visual debug section (checkboxes)
    const visualSection = this.createVisualDebugSection();
    this.container.appendChild(visualSection);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'debug-footer';
    footer.innerHTML = `
      <button class="debug-btn debug-reset-all">Reset All</button>
    `;
    footer.querySelector('.debug-reset-all')?.addEventListener('click', () => this.resetAll());
    this.container.appendChild(footer);
  }

  private createSection(sectionKey: string): HTMLElement {
    const section = document.createElement('div');
    section.className = 'debug-section';
    section.dataset.section = sectionKey;

    const metadata = PARAM_METADATA[sectionKey];
    const hasRebuildParams = Object.values(metadata).some((m) => m.requiresRebuild);

    // Header
    const header = document.createElement('div');
    header.className = 'debug-section-header';
    header.innerHTML = `
      <span class="debug-collapse-icon">&#9660;</span>
      <span class="debug-section-title">${SECTION_LABELS[sectionKey]}</span>
      <button class="debug-reset-btn">Reset</button>
    `;

    header.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('debug-reset-btn')) return;
      section.classList.toggle('collapsed');
    });

    header.querySelector('.debug-reset-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.resetSection(sectionKey);
    });

    section.appendChild(header);

    // Content
    const content = document.createElement('div');
    content.className = 'debug-section-content';

    const sectionConfig = this.config[sectionKey as keyof DebugConfig] as unknown as Record<string, number>;

    for (const [paramKey, meta] of Object.entries(metadata)) {
      const control = this.createSliderControl(sectionKey, paramKey, meta, sectionConfig[paramKey]);
      content.appendChild(control);
    }

    // Add rebuild button for wormShape section
    if (hasRebuildParams) {
      const rebuildSection = document.createElement('div');
      rebuildSection.className = 'debug-rebuild-section';
      this.rebuildBtn = document.createElement('button');
      this.rebuildBtn.className = 'debug-rebuild-btn';
      this.rebuildBtn.textContent = 'Apply Changes (Respawn)';
      this.rebuildBtn.disabled = true;
      this.rebuildBtn.addEventListener('click', () => {
        this.onRebuild();
        if (this.rebuildBtn) this.rebuildBtn.disabled = true;
      });
      rebuildSection.appendChild(this.rebuildBtn);
      content.appendChild(rebuildSection);
    }

    section.appendChild(content);
    return section;
  }

  private createSliderControl(
    sectionKey: string,
    paramKey: string,
    meta: ParamMeta,
    value: number
  ): HTMLElement {
    const control = document.createElement('div');
    control.className = 'debug-control';

    const rebuildIndicator = meta.requiresRebuild
      ? '<span class="rebuild-indicator" title="Requires rebuild">&#x21BB;</span>'
      : '';

    const unitLabel = meta.unit ? ` (${meta.unit})` : '';

    control.innerHTML = `
      <div class="debug-control-header">
        <label>${meta.label}${unitLabel}${rebuildIndicator}</label>
        <span class="debug-control-value">${value}</span>
      </div>
      <div class="debug-control-inputs">
        <input type="range" class="debug-slider"
          min="${meta.min}" max="${meta.max}" step="${meta.step}" value="${value}">
        <input type="number" class="debug-number"
          min="${meta.min}" max="${meta.max}" step="${meta.step}" value="${value}">
      </div>
    `;

    const slider = control.querySelector('.debug-slider') as HTMLInputElement;
    const numberInput = control.querySelector('.debug-number') as HTMLInputElement;
    const valueDisplay = control.querySelector('.debug-control-value') as HTMLElement;

    const updateValue = (newValue: number) => {
      const clamped = Math.max(meta.min, Math.min(meta.max, newValue));
      slider.value = String(clamped);
      numberInput.value = String(clamped);
      valueDisplay.textContent = String(clamped);

      const sectionConfig = this.config[sectionKey as keyof DebugConfig] as unknown as Record<string, number>;
      sectionConfig[paramKey] = clamped;
      this.saveToStorage();

      if (meta.requiresRebuild) {
        if (this.rebuildBtn) this.rebuildBtn.disabled = false;
      }

      this.onConfigChange(this.config, `${sectionKey}.${paramKey}`);
    };

    slider.addEventListener('input', () => updateValue(parseFloat(slider.value)));
    numberInput.addEventListener('change', () => updateValue(parseFloat(numberInput.value)));

    return control;
  }

  private createVisualDebugSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'debug-section';
    section.dataset.section = 'visualDebug';

    const header = document.createElement('div');
    header.className = 'debug-section-header';
    header.innerHTML = `
      <span class="debug-collapse-icon">&#9660;</span>
      <span class="debug-section-title">${SECTION_LABELS.visualDebug}</span>
      <button class="debug-reset-btn">Reset</button>
    `;

    header.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('debug-reset-btn')) return;
      section.classList.toggle('collapsed');
    });

    header.querySelector('.debug-reset-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.resetSection('visualDebug');
    });

    section.appendChild(header);

    const content = document.createElement('div');
    content.className = 'debug-section-content';

    const checkboxes = [
      { key: 'showGrabZones', label: 'Show Grab Zones' },
      { key: 'showPhysicsBodies', label: 'Show Physics Bodies' },
      { key: 'showJoints', label: 'Show Joints' },
      { key: 'showVelocityVectors', label: 'Show Velocity Vectors' },
      { key: 'showGroundedState', label: 'Show Grounded State' },
    ];

    for (const { key, label } of checkboxes) {
      const row = document.createElement('div');
      row.className = 'debug-checkbox-row';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'debug-checkbox';
      checkbox.id = `debug-${key}`;
      checkbox.checked = this.config.visualDebug[key as keyof typeof this.config.visualDebug];

      checkbox.addEventListener('change', () => {
        (this.config.visualDebug as unknown as Record<string, boolean>)[key] = checkbox.checked;
        this.saveToStorage();
        this.onConfigChange(this.config, `visualDebug.${key}`);
      });

      const labelEl = document.createElement('label');
      labelEl.className = 'debug-checkbox-label';
      labelEl.htmlFor = `debug-${key}`;
      labelEl.textContent = label;

      row.appendChild(checkbox);
      row.appendChild(labelEl);
      content.appendChild(row);
    }

    section.appendChild(content);
    return section;
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save debug config:', e);
    }
  }

  private loadFromStorage(): DebugConfig | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return this.mergeWithDefaults(parsed);
      }
    } catch (e) {
      console.warn('Failed to load debug config:', e);
    }
    return null;
  }

  private mergeWithDefaults(stored: Partial<DebugConfig>): DebugConfig {
    const defaults = deepClone(DEFAULT_DEBUG_CONFIG);
    return {
      physicsCore: { ...defaults.physicsCore, ...stored.physicsCore },
      wormShape: { ...defaults.wormShape, ...stored.wormShape },
      wormPhysics: { ...defaults.wormPhysics, ...stored.wormPhysics },
      joints: { ...defaults.joints, ...stored.joints },
      grabThrow: { ...defaults.grabThrow, ...stored.grabThrow },
      camera: { ...defaults.camera, ...stored.camera },
      visualDebug: { ...defaults.visualDebug, ...stored.visualDebug },
    };
  }

  private resetSection(sectionKey: string): void {
    const defaults = DEFAULT_DEBUG_CONFIG[sectionKey as keyof DebugConfig];
    (this.config as unknown as Record<string, unknown>)[sectionKey] = deepClone(defaults);
    this.saveToStorage();
    this.buildUI(); // Rebuild UI to reflect changes
    this.onConfigChange(this.config, sectionKey);
  }

  private resetAll(): void {
    this.config = deepClone(DEFAULT_DEBUG_CONFIG);
    this.saveToStorage();
    this.buildUI();
    this.onConfigChange(this.config, 'all');
  }

  private exportSettings(): void {
    const json = JSON.stringify(this.config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'worm-game-debug-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  private importSettings(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result as string);
          this.config = this.mergeWithDefaults(imported);
          this.saveToStorage();
          this.buildUI();
          this.onConfigChange(this.config, 'all');
        } catch (e) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  applyAllSettings(): void {
    this.onConfigChange(this.config, 'all');
  }
}
