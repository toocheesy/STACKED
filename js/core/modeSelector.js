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
    console.log(`🎮 Registered mode: ${modeObject.name}`);
  }

  // Get all available modes
  getModes() {
    return this.availableModes;
  }

  // Create mode selection UI
  createModeSelector() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    // Find or create mode selector section
    let modeSelectorSection = modal.querySelector('.mode-selector-section');
    if (!modeSelectorSection) {
      modeSelectorSection = document.createElement('div');
      modeSelectorSection.className = 'mode-selector-section';
      
      // Insert at the top of the modal content
      const modalContent = modal.querySelector('.modal-content') || modal;
      modalContent.insertBefore(modeSelectorSection, modalContent.firstChild);
    }

    modeSelectorSection.innerHTML = `
      <h3 style="color: #D2A679; margin-bottom: 15px; text-align: center;">🎮 Game Mode</h3>
      <div class="mode-selector">
        ${Object.entries(this.availableModes).map(([id, mode]) => `
          <div class="mode-option ${id === 'classic' ? 'selected' : ''}" data-mode="${id}">
            <h4>${mode.name}</h4>
            <p>${mode.description || 'Classic STACKED! gameplay'}</p>
            <div class="mode-config">
              ${this.renderModeConfig(mode)}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Add event listeners
    this.setupModeSelection();
  }

  renderModeConfig(mode) {
    if (!mode.config) return '';
    
    return Object.entries(mode.config).map(([key, value]) => {
      if (key === 'targetScore') {
        return `<span class="config-item">🎯 Target: ${value}</span>`;
      } else if (key === 'timeLimit') {
        return `<span class="config-item">⏰ Time: ${value}s</span>`;
      } else if (key === 'maxRounds') {
        return `<span class="config-item">🏁 Rounds: ${value}</span>`;
      }
      return '';
    }).join('');
  }

  setupModeSelection() {
    const modeOptions = document.querySelectorAll('.mode-option');
    
    modeOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Remove previous selection
        modeOptions.forEach(opt => opt.classList.remove('selected'));
        
        // Select new mode
        option.classList.add('selected');
        
        const modeId = option.dataset.mode;
        this.currentMode = modeId;
        
        // Update dynamic settings based on selected mode
        this.updateDynamicSettings(modeId);
        
        console.log(`🎮 Selected mode: ${this.availableModes[modeId].name}`);
      });
    });
  }

  updateDynamicSettings(modeId) {
    const mode = this.availableModes[modeId];
    if (!mode.getSettings) return;

    const settings = mode.getSettings();
    let dynamicSettingsHtml = '';

    Object.entries(settings).forEach(([key, config]) => {
      if (config.type === 'select') {
        dynamicSettingsHtml += `
          <label for="${key}">${config.label}:</label>
          <select id="${key}">
            ${config.options.map(option => 
              `<option value="${option}" ${option === config.default ? 'selected' : ''}>${option}</option>`
            ).join('')}
          </select>
        `;
      } else if (config.type === 'boolean') {
        dynamicSettingsHtml += `
          <label for="${key}">${config.label}:</label>
          <select id="${key}">
            <option value="true" ${config.default ? 'selected' : ''}>Yes</option>
            <option value="false" ${!config.default ? 'selected' : ''}>No</option>
          </select>
        `;
      }
    });

    // Find or create dynamic settings container
    let dynamicContainer = document.querySelector('.dynamic-mode-settings');
    if (!dynamicContainer) {
      dynamicContainer = document.createElement('div');
      dynamicContainer.className = 'dynamic-mode-settings';
      
      // Insert before the buttons
      const buttons = document.querySelector('.modal-buttons');
      if (buttons) {
        buttons.parentNode.insertBefore(dynamicContainer, buttons);
      }
    }

    dynamicContainer.innerHTML = dynamicSettingsHtml;
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

// Add CSS for mode selector
const modeSelectorCSS = `
.mode-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.mode-option {
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23331E0F" /><path d="M0 10 Q50 15 100 10 T100 30 T100 70 T0 60 T0 40 T0 20 T0 10" fill="none" stroke="%234A2B17" stroke-width="2" opacity="0.5" /></svg>');
  border: 2px solid #8B5A2B;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #D2A679;
}

.mode-option:hover {
  border-color: #D2A679;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 90, 43, 0.4);
}

.mode-option.selected {
  border-color: #4A7043;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23331E0F" /><path d="M0 10 Q50 15 100 10 T100 30 T100 70 T0 60 T0 40 T0 20 T0 10" fill="none" stroke="%234A2B17" stroke-width="2" opacity="0.5" /><rect width="100%" height="100%" fill="rgba(74,112,67,0.2)" /></svg>');
  box-shadow: 0 0 15px rgba(74, 112, 67, 0.6);
}

.mode-option h4 {
  margin: 0 0 8px 0;
  color: #D2A679;
  font-size: 1.1rem;
}

.mode-option p {
  margin: 0 0 10px 0;
  font-size: 0.9rem;
  color: #B88A5A;
  line-height: 1.3;
}

.mode-config {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.config-item {
  background: rgba(74, 43, 23, 0.3);
  border: 1px solid #4A2B17;
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 0.8rem;
  color: #D2A679;
}

.dynamic-mode-settings {
  background: rgba(74, 43, 23, 0.2);
  border: 1px solid #8B5A2B;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.dynamic-mode-settings label {
  color: #D2A679;
  font-weight: bold;
  margin-bottom: 5px;
  display: block;
}

.dynamic-mode-settings select {
  width: 100%;
  margin-bottom: 10px;
  padding: 5px;
  border: 1px solid #4A2B17;
  border-radius: 4px;
  background: #F5E8C7;
  color: #331E0F;
}

@media (max-width: 700px) {
  .mode-selector {
    grid-template-columns: 1fr;
  }
  
  .mode-option {
    padding: 12px;
  }
  
  .mode-option h4 {
    font-size: 1rem;
  }
  
  .mode-option p {
    font-size: 0.85rem;
  }
}
`;

// Inject CSS if it doesn't exist
if (!document.getElementById('mode-selector-css')) {
  const style = document.createElement('style');
  style.id = 'mode-selector-css';
  style.textContent = modeSelectorCSS;
  document.head.appendChild(style);
}

// Export for use in other files
window.ModeSelector = ModeSelector;