/* 
 * Speed Mode for STACKED!
 * Fast-paced gameplay with time pressure
 * 🔥 FIXED: Removed duplicate round increments - Clean syntax
 */

const SpeedMode = {
  name: "Speed STACKED",
  description: "Fast-paced STACKED! with time limits",
  
  // Mode configuration
  config: {
    targetScore: 300,
    timeLimit: 60,
    fastCards: true,
    autoSubmit: true,
    bonusMultiplier: 1.5,
    maxRounds: 3
  },

  // Timer state
  timer: {
    remaining: 60,
    interval: null,
    paused: false
  },


  // Initialize speed mode
  init(gameEngine) {
    gameEngine.state.settings.targetScore = this.config.targetScore;
    gameEngine.state.settings.cardSpeed = 'fast';
    
    this.startTimer(gameEngine);
    this.createSpeedUI();
  },

  createSpeedUI() {
    const timerDisplay = document.createElement('div');
    timerDisplay.id = 'speed-timer';
    timerDisplay.className = 'speed-timer';
    timerDisplay.textContent = `⏰ ${this.timer.remaining}s`;
    
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
      gameContainer.insertBefore(timerDisplay, gameContainer.firstChild);
    }
  },

  startTimer(gameEngine) {
    this.stopTimer(); // Clear any existing interval before starting new one
    this.timer.remaining = this.config.timeLimit;
    this.timer.paused = false;

    this.timer.interval = setInterval(() => {
      if (!this.timer.paused) {
        this.timer.remaining--;
        this.updateTimerDisplay();
        
        if (this.timer.remaining <= 0) {
          this.timeUp(gameEngine);
        } else if (this.timer.remaining <= 10) {
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
    
  },

  timeUp(gameEngine) {
    this.stopTimer();
    return this.forceRoundEnd(gameEngine);
  },

  forceRoundEnd(gameEngine) {
    const playerHandSize = gameEngine.state.hands[0].length;
    if (playerHandSize > 0) {
      gameEngine.addScore(0, -playerHandSize * 5);
    }
    
    return {
      roundOver: true,
      gameOver: false,
      reason: 'time_limit',
      message: `⏰ Time's up! ${playerHandSize > 0 ? `Penalty: -${playerHandSize * 5} pts` : ''}`
    };
  },

  calculateScore(cards) {
    const baseScore = window.calculateScore(cards);
    const timeBonus = Math.floor((this.timer.remaining / this.config.timeLimit) * baseScore * 0.5);
    const totalScore = Math.floor(baseScore * this.config.bonusMultiplier) + timeBonus;

    return totalScore;
  },

  onCapture(gameEngine, capturedCards) {
    const bonus = Math.floor((this.timer.remaining / this.config.timeLimit) * 50);
    if (bonus > 0) {
      this.showSpeedBonus(bonus);
    }
  },

  showSpeedBonus(bonus) {
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

  onRoundEnd(gameEngine) {
    this.stopTimer();
    this.timer.remaining = this.config.timeLimit;

    setTimeout(() => {
      if (gameEngine.currentRound <= this.config.maxRounds) {
        this.startTimer(gameEngine);
      }
    }, 2000);
  },

  onGameEnd(gameEngine) {
    this.stopTimer();
    
    const timerEl = document.getElementById('speed-timer');
    if (timerEl) {
      timerEl.remove();
    }
  },

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

// Add CSS for speed mode animations
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

if (!document.getElementById('speed-mode-css')) {
  const style = document.createElement('style');
  style.id = 'speed-mode-css';
  style.textContent = speedModeCSS;
  document.head.appendChild(style);
}

window.SpeedMode = SpeedMode;