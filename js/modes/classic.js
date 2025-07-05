/* 
 * Classic STACKED Mode - FIXED VERSION WITH PROPER JACKPOT MESSAGES!
 * 🏆 Now passes jackpot messages correctly to modals
 */

const ClassicMode = {
  name: "Classic STACKED",
  description: "The original STACKED! experience",
  initialized: false,
  
  config: {
    targetScore: 500,
    maxRounds: null,
    timeLimit: null,
    enableHints: true,
    enableMultiCapture: true
  },

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

  init(gameEngine) {
    if (this.initialized) return;
    this.initialized = true;
    gameEngine.state.settings.targetScore = this.config.targetScore;
  },

  calculateScore(cards) {
    return cards.reduce((total, card) => total + (this.pointsMap[card.value] || 0), 0);
  },

  // Classic mode just needs to check its own win conditions
checkEndCondition(gameEngine) {
  // Let GameEngine handle the standard flow with universal jackpot
  return null; // Use default GameEngine logic
},

  // 🔥 FIXED: applyLastComboTakesAll() - NOW CALCULATES CARD COUNT BEFORE CLEARING!
  applyLastComboTakesAll(gameEngine) {
    if (gameEngine.state.lastCapturer !== null && gameEngine.state.board.length > 0) {
      // 🔥 CRITICAL FIX: Store card count BEFORE clearing the board!
      const cardsCount = gameEngine.state.board.length;
      const bonusPoints = this.calculateScore(gameEngine.state.board);
      
      gameEngine.addScore(gameEngine.state.lastCapturer, bonusPoints);
      
      const playerNames = ['Player', 'Bot 1', 'Bot 2'];
      const lastCapturerName = playerNames[gameEngine.state.lastCapturer];
      
      console.log(`🏆 LAST COMBO TAKES ALL: ${lastCapturerName} sweeps ${cardsCount} remaining cards! +${bonusPoints} pts`);
      
      // Clear the board AFTER we have the message data
      gameEngine.state.board = [];
      
      // 🔥 FIXED: Use cardsCount instead of gameEngine.state.board.length
      return {
        message: `🏆 ${lastCapturerName} sweeps ${cardsCount} remaining cards! +${bonusPoints} pts`,
        points: bonusPoints,
        player: lastCapturerName,
        cardsCount: cardsCount
      };
    }
    return null;
  },

  getWinner(gameEngine) {
    const scores = [
      { name: 'Player', score: gameEngine.state.scores.player, index: 0 },
      { name: 'Bot 1', score: gameEngine.state.scores.bot1, index: 1 },
      { name: 'Bot 2', score: gameEngine.state.scores.bot2, index: 2 }
    ];
    
    return scores.sort((a, b) => b.score - a.score)[0];
  },

  validateCapture(areaCards, baseValue, baseCard, areaName) {
    return null; // Use standard validation
  },

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

  onCapture(gameEngine, capturedCards) {
    // Classic mode doesn't have special capture effects
  },

  onRoundEnd(gameEngine) {
    gameEngine.currentDealer = (gameEngine.currentDealer + 1) % 3;
  },

  onGameEnd(gameEngine) {
    const winner = this.getWinner(gameEngine);
    console.log(`🏆 Game Complete! Winner: ${winner.name} (${winner.score} pts)`);
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

window.ClassicMode = ClassicMode;