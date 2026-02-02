/* 
 * Game Mode Selector for STACKED!
 * Handles mode selection and settings UI
 */

class ModeSelector {
  constructor() {
    this.availableModes = {};
    this.currentMode = null;
  }

  // Register a new game mode
  registerMode(modeId, modeObject) {
    this.availableModes[modeId] = modeObject;
  }

  getSelectedMode() {
    return this.currentMode || 'classic';
  }

  getSelectedModeObject() {
    const modeId = this.getSelectedMode();
    return this.availableModes[modeId];
  }

  // Get settings for the selected mode
  getSelectedModeSettings() {
    const modeId = this.getSelectedMode();
    const mode = this.availableModes[modeId];
    
    if (!mode.getSettings) return {};

    const settings = {};
    const modeSettings = mode.getSettings();
    
    Object.keys(modeSettings).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        const value = element.value;
        // Convert boolean strings back to actual booleans
        if (value === 'true') {
          settings[key] = true;
        } else if (value === 'false') {
          settings[key] = false;
        } else if (!isNaN(value)) {
          settings[key] = parseInt(value);
        } else {
          settings[key] = value;
        }
      }
    });

    return settings;
  }
}

// Export for use in other files
window.ModeSelector = ModeSelector;