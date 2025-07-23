/* 
 * 🧠 LEGENDARY CARD INTELLIGENCE SYSTEM
 * The AI brain that tracks, predicts, and strategizes
 * Makes bots feel like genius human players!
 * 🔥 FIXED: Removed duplicate round tracking
 */

class CardIntelligenceSystem {
  constructor() {
    // 🔥 FIX: Define constants BEFORE calling reset()
    this.CARD_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    this.TOTAL_CARDS_PER_VALUE = 4; // 4 suits per value
    
    this.reset();
    
    console.log('🧠 CARD INTELLIGENCE SYSTEM INITIALIZED - AI BRAIN ONLINE!');
  }
  
  reset() {
    // Track what cards have been played/seen
    this.playedCards = {};
    if (this.CARD_VALUES) {
      this.CARD_VALUES.forEach(value => {
        this.playedCards[value] = 0;
      });
    }
    
    // Game state tracking - 🔥 REMOVED: roundNumber (GameEngine tracks this)
    this.totalCardsDealt = 0;
    this.gamePhase = 'early'; // early, mid, late, endgame
  }

const SpeedMode = {
  name: "Speed STACKED",
  description: "Fast-paced STACKED! with time limits",
  
  // Mode configuration
  config: {
    targetScore: 300,        // Lower target for faster games
    timeLimit: 60,           // 60 seconds per round
    fastCards: true,         // Faster card animations
    autoSubmit: true,        // Auto-submit valid combos
    bonusMultiplier: 1.5,    // Bonus points for quick captures
    maxRounds: 3             // Best of 3 rounds
  },

  // Timer state
  timer: {
    remaining: 60,
    interval: null,
    paused: false
  },

  // Scoring system with time bonuses
  pointsMap: {
    'A': 20,    // Higher values for speed mode
    'K': 15,
    'Q': 15, 
    'J': 15,
    '10': 15,
    '9': 10,
    '8': 10,
    '7': 10,
    '6': 10,
    '5': 10,
    '4': 10,
    '3': 10,
    '2': 10
  },

  // Initialize speed mode
  init(gameEngine) {
    console.log('⚡ Initializing Speed Mode');
    gameEngine.state.settings.targetScore = this.config.targetScore;
    gameEngine.state.settings.cardSpeed = 'fast';
    
    // Start the round timer
    this.startTimer(gameEngine);
    
    // Create speed mode UI elements
    this.createSpeedUI();
  },

  createSpeedUI() {
    // Add timer display to the UI
    const timerDisplay = document.createElement('div');
    timerDisplay.id = 'speed-timer';
    timerDisplay.className = 'speed-timer';
    timerDisplay.textContent = `⏰ ${this.timer.remaining}s`;
    
    // Add to top of game container
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
      gameContainer.insertBefore(timerDisplay, gameContainer.firstChild);
    }
  },

  startTimer(gameEngine) {
    this.timer.remaining = this.config.timeLimit;
    this.timer.paused = false;
    
    this.timer.interval = setInterval(() => {
      if (!this.timer.paused) {
        this.timer.remaining--;
        this.updateTimerDisplay();
        
        if (this.timer.remaining <= 0) {
          this.timeUp(gameEngine);
        } else if (this.timer.remaining <= 10) {
          // Warning animation for last 10 seconds
          this.showTimeWarning();
        }
      }
    }, 1000);
  },

  stopTimer() {
    if (this.timer.interval) {
      clearInterval(this.timer.interval);
      this.timer.interval = null;
    }
  },

  updateTimerDisplay() {
    const timerEl = document.getElementById('speed-timer');
    if (timerEl) {
      timerEl.textContent = `⚡ ${this.timer.remaining}s`;
      
      // Color coding for urgency
      if (this.timer.remaining <= 10) {
        timerEl.style.color = '#e74c3c';
        timerEl.style.animation = 'pulse 1s infinite';
      } else if (this.timer.remaining <= 30) {
        timerEl.style.color = '#f39c12';
      } else {
        timerEl.style.color = '#2ecc71';
      }
    }
  },

  showTimeWarning() {
    const timerEl = document.getElementById('speed-timer');
    if (timerEl) {
      timerEl.style.transform = 'scale(1.2)';
      setTimeout(() => {
        timerEl.style.transform = 'scale(1)';
      }, 200);
    }
    
    // Play warning sound
    if (window.playSound) {
      playSound('warning');
    }
  },

  timeUp(gameEngine) {
    console.log('⏰ TIME UP! Ending round...');
    this.stopTimer();
    
    // Force end the round
    this.forceRoundEnd(gameEngine);
  },

  forceRoundEnd(gameEngine) {
    // Add any cards in hand as penalty (negative points)
    const playerHandSize = gameEngine.state.hands[0].length;
    if (playerHandSize > 0) {
      gameEngine.addScore(0, -playerHandSize * 5); // -5 points per card
      console.log(`⚡ SPEED PENALTY: Player loses ${playerHandSize * 5} points for cards in hand`);
    }
    
    // End the round immediately
    return {
      roundOver: true,
      gameOver: false,
      reason: 'time_limit',
      message: `⏰ Time's up! ${playerHandSize > 0 ? `Penalty: -${playerHandSize * 5} pts` : ''}`
    };
  },

  // Calculate score with speed bonuses
  calculateScore(cards) {
    const baseScore = cards.reduce((total, card) => total + (this.pointsMap[card.value] || 0), 0);
    
    // Time bonus: more points for captures with more time remaining
    const timeBonus = Math.floor((this.timer.remaining / this.config.timeLimit) * baseScore * 0.5);
    
    const totalScore = Math.floor(baseScore * this.config.bonusMultiplier) + timeBonus;
    
    console.log(`⚡ SPEED CAPTURE: Base: ${baseScore}, Time Bonus: ${timeBonus}, Total: ${totalScore}`);
    return totalScore;
  },

  // Check if game should end (speed mode rules)
  checkEndCondition(gameEngine) {
    // Check timer first
    if (this.timer.remaining <= 0) {
      return this.forceRoundEnd(gameEngine);
    }
    
    const playersWithCards = gameEngine.state.hands.filter(hand => hand.length > 0).length;
    
    if (playersWithCards === 0) {
      // Round completed naturally
      this.stopTimer();
      
      if (gameEngine.state.deck.length === 0) {
        // Apply last combo takes all
        this.applyLastComboTakesAll(gameEngine);
        
        // 🔥 FIXED: Don't increment round here - GameStateManager handles it
        // Check if anyone reached target score OR max rounds reached
        const maxScore = Math.max(
          gameEngine.state.scores.player, 
          gameEngine.state.scores.bot1, 
          gameEngine.state.scores.bot2
        );
        
        if (maxScore >= this.config.targetScore || gameEngine.currentRound >= this.config.maxRounds) {
          return { 
            gameOver: true, 
            winner: this.getWinner(gameEngine),
            reason: maxScore >= this.config.targetScore ? 'target_score_reached' : 'max_rounds_reached'
          };
        } else {
          return { 
            roundOver: true, 
            gameOver: false,
            reason: 'round_complete'
          };
        }
      } else {
        return { continueRound: true };
      }
    }
    
    return { continue: true };
  },

  // Speed mode uses same last combo rule as classic
  applyLastComboTakesAll(gameEngine) {
    if (gameEngine.state.lastCapturer !== null && gameEngine.state.board.length > 0) {
      const bonusPoints = this.calculateScore(gameEngine.state.board);
      gameEngine.addScore(gameEngine.state.lastCapturer, bonusPoints);
      
      const playerNames = ['Player', 'Bot 1', 'Bot 2'];
      const lastCapturerName = playerNames[gameEngine.state.lastCapturer];
      
      console.log(`🏆 SPEED SWEEP: ${lastCapturerName} gets ${bonusPoints} bonus points!`);
      gameEngine.state.board = [];
      
      return {
        message: `⚡ ${lastCapturerName} speed-sweeps ${gameEngine.state.board.length} cards! +${bonusPoints} pts`,
        points: bonusPoints,
        player: lastCapturerName
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

  // Speed mode has faster validation (auto-submit)
  validateCapture(areaCards, baseValue, baseCard, areaName) {
    // Use standard validation but with auto-submit feature
    return null; // Uses GameEngine standard validation
  },

  // Handle speed mode events
  onCapture(gameEngine, capturedCards) {
    console.log(`⚡ Speed capture: ${capturedCards.length} cards in ${this.timer.remaining}s remaining`);
    
    // Show speed bonus popup
    const bonus = Math.floor((this.timer.remaining / this.config.timeLimit) * 50);
    if (bonus > 0) {
      this.showSpeedBonus(bonus);
    }
  },

  showSpeedBonus(bonus) {
    // Create temporary bonus display
    const bonusEl = document.createElement('div');
    bonusEl.className = 'speed-bonus-popup';
    bonusEl.textContent = `⚡ SPEED BONUS: +${bonus}`;
    bonusEl.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(45deg, #f39c12, #e67e22);
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-weight: bold;
      z-index: 9999;
      animation: speedBonusPop 2s ease-out forwards;
    `;
    
    document.body.appendChild(bonusEl);
    
    setTimeout(() => {
      bonusEl.remove();
    }, 2000);
  },

  // 🔥 FIXED: onRoundEnd() - Don't increment rounds, only reset timer
  onRoundEnd(gameEngine) {
    console.log('⚡ SPEED MODE: Round ending, resetting timer');
    this.stopTimer();
    
    // Reset timer for next round
    this.timer.remaining = this.config.timeLimit;
    
    // 🔥 REMOVED: Don't touch dealer or round - GameStateManager handles it
    // gameEngine.currentDealer = (gameEngine.currentDealer + 1) % 3;
    // gameEngine.currentRound++;
    
    console.log(`⚡ Speed Mode round end handling complete`);
    
    // Restart timer if game continues (with delay for modal)
    setTimeout(() => {
      if (gameEngine.currentRound <= this.config.maxRounds) {
        console.log('⚡ RESTARTING TIMER FOR NEW ROUND');
        this.startTimer(gameEngine);
      }
    }, 2000); // Wait for round end modal
  },

  onGameEnd(gameEngine) {
    this.stopTimer();
    const winner = this.getWinner(gameEngine);
    console.log(`⚡ Speed Mode Complete! Winner: ${winner.name} with ${winner.score} points in ${gameEngine.currentRound} rounds`);
    
    // Remove speed UI
    const timerEl = document.getElementById('speed-timer');
    if (timerEl) {
      timerEl.remove();
    }
  },

  // Get speed mode UI elements
  getCustomUI() {
    return {
      targetScoreDisplay: true,
      roundCounter: true,
      dealerIndicator: true,
      hintButton: false,  // No hints in speed mode!
      timerDisplay: true,
      speedBonus: true
    };
  },

  // Speed mode settings
  getSettings() {
    return {
      timeLimit: {
        type: 'select',
        options: [30, 45, 60, 90, 120],
        default: 60,
        label: 'Time Limit (seconds)'
      },
      targetScore: {
        type: 'select',
        options: [200, 300, 400, 500],
        default: 300,
        label: 'Target Score'
      },
      maxRounds: {
        type: 'select',
        options: [1, 3, 5],
        default: 3,
        label: 'Max Rounds'
      }
    };
  }
};

// Add required CSS for speed mode animations
const speedModeCSS = `
@keyframes speedBonusPop {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1) translateY(-50px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.speed-timer {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(45deg, #2ecc71, #27ae60);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 1.2rem;
  z-index: 1000;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  transition: all 0.3s ease;
}
`;

// Inject CSS if it doesn't exist
if (!document.getElementById('speed-mode-css')) {
  const style = document.createElement('style');
  style.id = 'speed-mode-css';
  style.textContent = speedModeCSS;
  document.head.appendChild(style);
}

// Export for use in other files
window.SpeedMode = SpeedMode;