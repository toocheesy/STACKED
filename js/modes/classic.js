/* 
 * Classic STACKED Mode - FINAL FIXED VERSION
 * 🔥 NOW PROPERLY RETURNS JACKPOT MESSAGES TO MODALS!
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

  // 🔥 FINAL FIX: checkEndCondition() - NOW CAPTURES AND RETURNS JACKPOT MESSAGE!
  checkEndCondition(gameEngine) {
    const playersWithCards = gameEngine.state.hands.filter(hand => hand.length > 0).length;
    
    if (playersWithCards === 0) {
      if (gameEngine.state.deck.length === 0) {
        // 🔥 CRITICAL FIX: CAPTURE the jackpot result and USE its message!
        const jackpotResult = this.applyLastComboTakesAll(gameEngine);
        const jackpotMessage = jackpotResult ? jackpotResult.message : null;
        
        console.log(`🔥 JACKPOT MESSAGE CAPTURED: "${jackpotMessage}"`);
        
        const maxScore = Math.max(
          gameEngine.state.scores.player, 
          gameEngine.state.scores.bot1, 
          gameEngine.state.scores.bot2
        );
        
        if (maxScore >= this.config.targetScore) {
          return { 
            gameOver: true, 
            winner: this.getWinner(gameEngine),
            reason: 'target_score_reached',
            message: jackpotMessage  // 🔥 PASS THE MESSAGE!
          };
        } else {
          return { 
            roundOver: true, 
            gameOver: false,
            reason: 'round_complete',
            message: jackpotMessage  // 🔥 PASS THE MESSAGE!
          };
        }
      } else {
        return { continueRound: true };
      }
    }
    
    return { continue: true };
  },

  // 🔥 JACKPOT LOGIC - WORKING CORRECTLY, JUST NEEDED TO RETURN MESSAGE
  applyLastComboTakesAll(gameEngine) {
    if (gameEngine.state.lastCapturer !== null && gameEngine.state.board.length > 0) {
      // Store card count BEFORE clearing the board
      const cardsCount = gameEngine.state.board.length;
      const bonusPoints = this.calculateScore(gameEngine.state.board);
      
      gameEngine.addScore(gameEngine.state.lastCapturer, bonusPoints);
      
      const playerNames = ['Player', 'Bot 1', 'Bot 2'];
      const lastCapturerName = playerNames[gameEngine.state.lastCapturer];
      
      console.log(`🏆 LAST COMBO TAKES ALL: ${lastCapturerName} sweeps ${cardsCount} remaining cards! +${bonusPoints} pts`);
      
      // Clear the board AFTER creating the message
      gameEngine.state.board = [];
      
      // 🔥 RETURN the complete message object
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
    
    return scores.sort((a, b) => b.score - a.sort)[0];
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