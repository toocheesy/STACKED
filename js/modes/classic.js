/* 
 * Classic STACKED Mode
 * The original game rules and scoring
 */

const ClassicMode = {
  name: "Classic STACKED",
  description: "The original STACKED! experience",
  
  // Mode configuration
  config: {
    targetScore: 500,
    maxRounds: null,
    timeLimit: null,
    enableHints: true,
    enableMultiCapture: true
  },

  // Scoring system
  pointsMap: {
    'A': 15,
    'K': 10,
    'Q': 10, 
    'J': 10,
    '10': 10,
    '9': 5,
    '8': 5,
    '7': 5,
    '6': 5,
    '5': 5,
    '4': 5,
    '3': 5,
    '2': 5
  },

  // Initialize mode
  init(gameEngine) {
    console.log('🎮 Initializing Classic Mode');
    gameEngine.state.settings.targetScore = this.config.targetScore;
  },

  // Calculate score for captured cards
  calculateScore(cards) {
    return cards.reduce((total, card) => total + (this.pointsMap[card.value] || 0), 0);
  },

  // Check if game should end
  checkEndCondition(gameEngine) {
    const playersWithCards = gameEngine.state.hands.filter(hand => hand.length > 0).length;
    
    if (playersWithCards === 0) {
      // All players are out of cards
      if (gameEngine.state.deck.length === 0) {
        // Round over - apply Last Combo Takes All rule
        this.applyLastComboTakesAll(gameEngine);
        
        // Check if anyone reached target score
        const maxScore = Math.max(
          gameEngine.state.scores.player, 
          gameEngine.state.scores.bot1, 
          gameEngine.state.scores.bot2
        );
        
        if (maxScore >= this.config.targetScore) {
          return { 
            gameOver: true, 
            winner: this.getWinner(gameEngine),
            reason: 'target_score_reached'
          };
        } else {
          return { 
            roundOver: true, 
            gameOver: false,
            reason: 'round_complete'
          };
        }
      } else {
        // Deal new cards and continue
        return { continueRound: true };
      }
    }
    
    return { continue: true };
  },

  // Apply "Last Combo Takes All" rule
  applyLastComboTakesAll(gameEngine) {
    if (gameEngine.state.lastCapturer !== null && gameEngine.state.board.length > 0) {
      const bonusPoints = this.calculateScore(gameEngine.state.board);
      gameEngine.addScore(gameEngine.state.lastCapturer, bonusPoints);
      
      const playerNames = ['Player', 'Bot 1', 'Bot 2'];
      const lastCapturerName = playerNames[gameEngine.state.lastCapturer];
      
      console.log(`🏆 LAST COMBO TAKES ALL: ${lastCapturerName} gets ${bonusPoints} bonus points!`);
      
      // Clear the board
      gameEngine.state.board = [];
      
      return {
        message: `${lastCapturerName} sweeps ${gameEngine.state.board.length} cards! +${bonusPoints} pts`,
        points: bonusPoints,
        player: lastCapturerName
      };
    }
    return null;
  },

  // Get current winner
  getWinner(gameEngine) {
    const scores = [
      { name: 'Player', score: gameEngine.state.scores.player, index: 0 },
      { name: 'Bot 1', score: gameEngine.state.scores.bot1, index: 1 },
      { name: 'Bot 2', score: gameEngine.state.scores.bot2, index: 2 }
    ];
    
    return scores.sort((a, b) => b.score - a.score)[0];
  },

  // Custom validation rules (uses standard validation for classic mode)
  validateCapture(areaCards, baseValue, baseCard, areaName) {
    // Classic mode uses the standard validation from GameEngine
    return null; // This tells GameEngine to use its standardValidation
  },

  // Get available actions for current player
  getAvailableActions(gameEngine) {
    const actions = ['place_card'];
    
    if (this.config.enableMultiCapture) {
      actions.push('capture');
    }
    
    if (this.config.enableHints && gameEngine.state.currentPlayer === 0) {
      actions.push('hint');
    }
    
    return actions;
  },

  // Handle mode-specific events
  onCapture(gameEngine, capturedCards) {
    // Classic mode doesn't have special capture effects
    console.log(`🎯 Classic capture: ${capturedCards.length} cards`);
  },

  onRoundEnd(gameEngine) {
    // Rotate dealer
    gameEngine.currentDealer = (gameEngine.currentDealer + 1) % 3;
    gameEngine.currentRound++;
    console.log(`🔄 Round ${gameEngine.currentRound} starting, ${['Player', 'Bot 1', 'Bot 2'][gameEngine.currentDealer]} deals`);
  },

  onGameEnd(gameEngine) {
    const winner = this.getWinner(gameEngine);
    console.log(`🏆 Classic Mode Complete! Winner: ${winner.name} with ${winner.score} points`);
  },

  // Get mode-specific UI elements
  getCustomUI() {
    return {
      targetScoreDisplay: true,
      roundCounter: true,
      dealerIndicator: true,
      hintButton: this.config.enableHints
    };
  },

  // Export mode configuration for settings
  getSettings() {
    return {
      targetScore: {
        type: 'select',
        options: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
        default: 500,
        label: 'Target Score'
      },
      enableHints: {
        type: 'boolean',
        default: true,
        label: 'Enable Hints'
      }
    };
  }
};

// Export for use in other files
window.ClassicMode = ClassicMode;