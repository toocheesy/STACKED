/*
 * Adventure Mode - Game Mode Object
 * Follows ClassicMode pattern with per-level restrictions
 */

const AdventureMode = {
  name: 'Adventure',
  description: 'Story-driven progression through 6 worlds',
  initialized: false,

  // Set dynamically per level
  levelConfig: null,

  config: {
    targetScore: 300,
    maxRounds: null,
    timeLimit: null,
    enableHints: true,
    enableMultiCapture: true
  },


  init(gameEngine) {
    this.initialized = true;
    this.levelConfig = null;

    // Remove previous CSS class
    const container = document.querySelector('.game-container');
    if (container) {
      container.classList.remove('adventure-world-1', 'adventure-world-2', 'adventure-world-3',
        'adventure-world-4', 'adventure-world-5', 'adventure-world-6');
    }

    // Read level config from localStorage
    const storedLevel = localStorage.getItem('adventureLevel');
    if (storedLevel) {
      try {
        this.levelConfig = JSON.parse(storedLevel);
      } catch (e) {
        console.error('Failed to parse adventure level config:', e);
      }
    }

    if (this.levelConfig) {
      this.config.targetScore = this.levelConfig.targetScore;
      gameEngine.state.settings.targetScore = this.levelConfig.targetScore;

      // Apply CSS class for combo area visibility
      const gameContainer = document.querySelector('.game-container');
      if (gameContainer && this.levelConfig.cssClass) {
        gameContainer.classList.add(this.levelConfig.cssClass);
      }
    }
  },

  calculateScore(cards) {
    return window.calculateScore(cards);
  },

  // Enforce world restrictions on captures
  validateCapture(areaCards, baseValue, baseCard, areaName) {
    if (!this.levelConfig || !this.levelConfig.restrictions) {
      return null; // No restrictions, use standard validation
    }

    const restrictions = this.levelConfig.restrictions;

    // World 1: Pairs only - block sum areas
    if (restrictions.includes('pairsOnly')) {
      if (areaName !== 'match') {
        return {
          isValid: false,
          details: 'In this world, only pair captures are allowed! Use the Match area.'
        };
      }
    }

    // World 2: No sum2/sum3
    if (restrictions.includes('noSum2') && areaName === 'sum2') {
      return {
        isValid: false,
        details: 'Sum Area 2 is not available in this world yet!'
      };
    }
    if (restrictions.includes('noSum3') && areaName === 'sum3') {
      return {
        isValid: false,
        details: 'Sum Area 3 is not available in this world yet!'
      };
    }

    return null; // Pass through to standard validation
  },

  applyLastComboTakesAll(gameEngine) {
    // Delegate to ClassicMode's implementation
    return ClassicMode.applyLastComboTakesAll.call(this, gameEngine);
  },

  getWinner(gameEngine) {
    return ClassicMode.getWinner(gameEngine);
  },

  onCapture(gameEngine, capturedCards) {
    // No special capture effects
  },

  onRoundEnd(gameEngine) {
    // No special round end logic
  },

  onGameEnd(gameEngine) {
    // Adventure completion handled by main.js
  },

  getAvailableActions(gameEngine) {
    const actions = ['place_card', 'capture'];
    if (this.config.enableHints && gameEngine.state.currentPlayer === 0) {
      actions.push('hint');
    }
    return actions;
  },

  getCustomUI() {
    return {
      targetScoreDisplay: true,
      roundCounter: true,
      dealerIndicator: true,
      hintButton: this.config.enableHints
    };
  },

  getSettings() {
    return {};
  },

  // Check if a bot capture should be filtered based on restrictions
  filterBotCapture(capture) {
    if (!this.levelConfig || !this.levelConfig.restrictions) return true;

    const restrictions = this.levelConfig.restrictions;

    // World 1: Bots can only do pair captures
    if (restrictions.includes('pairsOnly')) {
      return capture.type === 'pair';
    }

    return true; // No filtering needed
  }
};

window.AdventureMode = AdventureMode;
