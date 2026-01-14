export const DEBUG_PANEL_STYLES = `
#debug-panel {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 300px;
  max-height: calc(100vh - 20px);
  overflow-y: auto;
  background: rgba(15, 15, 25, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  font-size: 12px;
  color: #e0e0e0;
  z-index: 10000;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
  user-select: none;
}

#debug-panel::-webkit-scrollbar {
  width: 6px;
}

#debug-panel::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

#debug-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  position: sticky;
  top: 0;
  z-index: 1;
}

.debug-title {
  font-weight: 600;
  font-size: 13px;
  color: #fff;
}

.debug-header-buttons {
  display: flex;
  gap: 6px;
}

.debug-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #ccc;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: background 0.15s, color 0.15s;
}

.debug-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.debug-close {
  font-size: 16px;
  line-height: 1;
  padding: 2px 6px;
}

.debug-section {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.debug-section:last-child {
  border-bottom: none;
}

.debug-section-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);
  transition: background 0.15s;
}

.debug-section-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.debug-collapse-icon {
  font-size: 10px;
  margin-right: 8px;
  transition: transform 0.2s;
  color: #888;
}

.debug-section.collapsed .debug-collapse-icon {
  transform: rotate(-90deg);
}

.debug-section-title {
  flex: 1;
  font-weight: 500;
  color: #ddd;
}

.debug-reset-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 10px;
  padding: 2px 6px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
}

.debug-section-header:hover .debug-reset-btn {
  opacity: 1;
}

.debug-reset-btn:hover {
  color: #fff;
}

.debug-section-content {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.debug-section.collapsed .debug-section-content {
  display: none;
}

.debug-control {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.debug-control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.debug-control label {
  font-size: 11px;
  color: #aaa;
}

.debug-control-value {
  font-size: 11px;
  color: #888;
  font-family: monospace;
}

.debug-control-inputs {
  display: flex;
  gap: 8px;
  align-items: center;
}

.debug-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  outline: none;
}

.debug-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: #6a9fea;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.15s;
}

.debug-slider::-webkit-slider-thumb:hover {
  background: #8ab4f0;
}

.debug-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #6a9fea;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.debug-number {
  width: 50px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ddd;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 11px;
  text-align: right;
  font-family: monospace;
}

.debug-number:focus {
  outline: none;
  border-color: rgba(106, 159, 234, 0.5);
}

.rebuild-indicator {
  color: #e8a54b;
  font-size: 9px;
  margin-left: 4px;
}

.debug-checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}

.debug-checkbox {
  width: 14px;
  height: 14px;
  accent-color: #6a9fea;
  cursor: pointer;
}

.debug-checkbox-label {
  font-size: 11px;
  color: #bbb;
  cursor: pointer;
}

.debug-rebuild-section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.debug-rebuild-btn {
  width: 100%;
  background: rgba(232, 165, 75, 0.2);
  border: 1px solid rgba(232, 165, 75, 0.4);
  color: #e8a54b;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: background 0.15s;
}

.debug-rebuild-btn:hover {
  background: rgba(232, 165, 75, 0.3);
}

.debug-rebuild-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.debug-footer {
  padding: 10px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 8px;
}

.debug-footer .debug-btn {
  flex: 1;
}

.debug-reset-all {
  background: rgba(234, 106, 106, 0.15);
  color: #ea6a6a;
}

.debug-reset-all:hover {
  background: rgba(234, 106, 106, 0.25);
  color: #f08080;
}

.debug-hidden {
  display: none !important;
}
`;

export function injectDebugStyles(): void {
  if (document.getElementById('debug-panel-styles')) return;

  const style = document.createElement('style');
  style.id = 'debug-panel-styles';
  style.textContent = DEBUG_PANEL_STYLES;
  document.head.appendChild(style);
}
