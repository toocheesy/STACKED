/* 
 * 🎪 MODAL MANAGER - Clean Modal System for STACKED!
 * Single source of truth for ALL modals with game pausing
 * Replaces both ui.js modal system and helpers.js modal functions
 */

class ModalManager {
  constructor(gameEngine, uiSystem) {
    this.game = gameEngine;
    this.ui = uiSystem;
    
    // Modal state
    this.activeModal = null;
    this.gameWasPaused = false;
    this.modalContainer = null;
    
    // Available modal types
    this.modalTypes = {
      ROUND_END: 'round_end',
      GAME_OVER: 'game_over', 
      ERROR: 'error',
      SETTINGS: 'settings',
      HINT: 'hint',
      PAUSE: 'pause',
      CONFIRM: 'confirm'
    };
    
  }

  // 🎯 MAIN MODAL DISPLAY FUNCTION
  show(type, data = {}) {
    
    // Close any existing modal first
    if (this.activeModal) {
      this.hide();
    }
    
    // Pause the game
    this.pauseGame();
    
    // Create modal content
    const modalContent = this.createModalContent(type, data);
    if (!modalContent) {
      console.error(`🚨 Unknown modal type: ${type}`);
      this.resumeGame();
      return false;
    }
    
    // Create modal container
    this.createModalContainer(modalContent);
    
    // Set up event handlers
    this.setupModalHandlers(type, data);
    
    // Track active modal
    this.activeModal = type;

    // Animate in
    setTimeout(() => {
      if (this.modalContainer) {
        this.modalContainer.classList.add('show');
      }
    }, 50);

    return true;
  }

  // 🚪 HIDE MODAL AND RESUME GAME
  hide() {
    if (!this.activeModal || !this.modalContainer) {
      return;
    }
    
    // Animate out
    this.modalContainer.classList.add('hide');
    
    setTimeout(() => {
      // Remove from DOM
      if (this.modalContainer && this.modalContainer.parentNode) {
        this.modalContainer.parentNode.removeChild(this.modalContainer);
      }
      
      // Clean up state
      this.modalContainer = null;
      this.activeModal = null;
      
      // Resume game
      this.resumeGame();
    }, 300);
  }

  // 🎨 CREATE MODAL CONTENT BASED ON TYPE
  createModalContent(type, data) {
    switch(type) {
      case this.modalTypes.ROUND_END:
        return this.createRoundEndModal(data);
      case this.modalTypes.GAME_OVER:
        return this.createGameOverModal(data);
      case this.modalTypes.ERROR:
        return this.createErrorModal(data);
      case this.modalTypes.SETTINGS:
        return this.createSettingsModal(data);
      case this.modalTypes.HINT:
        return this.createHintModal(data);
      case this.modalTypes.PAUSE:
        return this.createPauseModal(data);
      case this.modalTypes.CONFIRM:
        return this.createConfirmModal(data);
      default:
        return null;
    }
  }

  // 🏆 ROUND END MODAL
  createRoundEndModal(data) {
    const { scores, jackpot, newRound, oldDealer, newDealer } = data;
    
    let jackpotHTML = '';
    if (jackpot && jackpot.hasJackpot) {
      jackpotHTML = `
        <div class="jackpot-announcement">
          🏆 <strong>${jackpot.winnerName}</strong> sweeps the board!<br>
          <span class="jackpot-points">+${jackpot.points} bonus points!</span>
        </div>
      `;
    }
    
    const dealerNames = ['Player', 'Bot 1', 'Bot 2'];
    
    return `
      <div class="game-modal round-end-modal">
        <div class="modal-header">
          <h2>🏁 Round ${newRound - 1} Complete!</h2>
        </div>
        <div class="modal-content">
          ${jackpotHTML}
          <div class="round-scores">
            <h3>Round Scores:</h3>
            <div class="score-grid">
              <div class="score-item ${scores.player >= scores.bot1 && scores.player >= scores.bot2 ? 'winner' : ''}">
                <span class="player-name">Player</span>
                <span class="player-score">${scores.player} pts</span>
              </div>
              <div class="score-item ${scores.bot1 >= scores.player && scores.bot1 >= scores.bot2 ? 'winner' : ''}">
                <span class="player-name">Bot 1</span>
                <span class="player-score">${scores.bot1} pts</span>
              </div>
              <div class="score-item ${scores.bot2 >= scores.player && scores.bot2 >= scores.bot1 ? 'winner' : ''}">
                <span class="player-name">Bot 2</span>
                <span class="player-score">${scores.bot2} pts</span>
              </div>
            </div>
          </div>
          <div class="round-info">
            <p><strong>Round ${newRound}</strong> starting...</p>
            <p>New dealer: <strong>${dealerNames[newDealer]}</strong></p>
          </div>
        </div>
        <div class="modal-actions">
          <button id="continue-round-btn" class="continue-btn">Continue Game →</button>
        </div>
      </div>
    `;
  }

  // 🎉 GAME OVER MODAL
  createGameOverModal(data) {
    const { scores, jackpot, winner, winnerName, winnerScore } = data;
    
    let jackpotHTML = '';
    if (jackpot && jackpot.hasJackpot) {
      jackpotHTML = `
        <div class="jackpot-announcement">
          🏆 Final sweep by <strong>${jackpot.winnerName}</strong>!<br>
          <span class="jackpot-points">+${jackpot.points} bonus points!</span>
        </div>
      `;
    }
    
    return `
      <div class="game-modal game-over-modal">
        <div class="modal-header">
          <h2>🎉 Game Over!</h2>
        </div>
        <div class="modal-content">
          <div class="winner-announcement">
            <h3>🏆 ${winnerName} Wins!</h3>
            <p class="winner-score">${winnerScore} points</p>
          </div>
          ${jackpotHTML}
          <div class="final-scores">
            <h3>Final Scores:</h3>
            <div class="score-grid">
              <div class="score-item ${winner === 0 ? 'winner' : ''}">
                <span class="player-name">Player</span>
                <span class="player-score">${scores.player} pts</span>
              </div>
              <div class="score-item ${winner === 1 ? 'winner' : ''}">
                <span class="player-name">Bot 1</span>
                <span class="player-score">${scores.bot1} pts</span>
              </div>
              <div class="score-item ${winner === 2 ? 'winner' : ''}">
                <span class="player-name">Bot 2</span>
                <span class="player-score">${scores.bot2} pts</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button id="new-game-btn" class="restart-btn">Play Again</button>
          <button id="home-btn" class="home-btn">Home</button>
        </div>
      </div>
    `;
  }

  // 🚨 ERROR MODAL
  createErrorModal(data) {
    return `
      <div class="game-modal error-modal">
        <div class="modal-header">
          <h2>⚠️ Game Error</h2>
        </div>
        <div class="modal-content">
          <p>${data.userMessage || 'An error occurred during gameplay.'}</p>
          <details>
            <summary>Technical Details</summary>
            <pre>${data.technicalDetails || 'No details available'}</pre>
          </details>
        </div>
        <div class="modal-actions">
          <button id="restart-game-btn" class="restart-btn">Restart Game</button>
        </div>
      </div>
    `;
  }

  // ⚙️ SETTINGS MODAL (Future)
  createSettingsModal(data) {
    return `
      <div class="game-modal settings-modal">
        <div class="modal-header">
          <h2>⚙️ Game Settings</h2>
        </div>
        <div class="modal-content">
          <p>Settings panel coming soon...</p>
        </div>
        <div class="modal-actions">
          <button id="close-settings-btn" class="continue-btn">Close</button>
        </div>
      </div>
    `;
  }

  // 💡 HINT MODAL (Future)
  createHintModal(data) {
    return `
      <div class="game-modal hint-modal">
        <div class="modal-header">
          <h2>💡 Game Hint</h2>
        </div>
        <div class="modal-content">
          <p>${data.hintText || 'No hints available right now.'}</p>
        </div>
        <div class="modal-actions">
          <button id="close-hint-btn" class="continue-btn">Got it!</button>
        </div>
      </div>
    `;
  }

  // ⏸️ PAUSE MODAL (Future)
  createPauseModal(data) {
    return `
      <div class="game-modal pause-modal">
        <div class="modal-header">
          <h2>⏸️ Game Paused</h2>
        </div>
        <div class="modal-content">
          <p>Game is paused. Ready to continue?</p>
        </div>
        <div class="modal-actions">
          <button id="resume-game-btn" class="continue-btn">Resume Game</button>
          <button id="quit-game-btn" class="home-btn">Quit to Home</button>
        </div>
      </div>
    `;
  }

  // ❓ CONFIRM MODAL (Future)
  createConfirmModal(data) {
    return `
      <div class="game-modal confirm-modal">
        <div class="modal-header">
          <h2>❓ ${data.title || 'Confirm Action'}</h2>
        </div>
        <div class="modal-content">
          <p>${data.message || 'Are you sure?'}</p>
        </div>
        <div class="modal-actions">
          <button id="confirm-yes-btn" class="restart-btn">${data.yesText || 'Yes'}</button>
          <button id="confirm-no-btn" class="continue-btn">${data.noText || 'No'}</button>
        </div>
      </div>
    `;
  }

  // 🎪 CREATE MODAL CONTAINER
  createModalContainer(modalContent) {
    // Remove any existing modal
    const existing = document.getElementById('modal-container');
    if (existing) {
      existing.remove();
    }
    
    // Create new container
    this.modalContainer = document.createElement('div');
    this.modalContainer.id = 'modal-container';
    this.modalContainer.className = 'modal-overlay';
    this.modalContainer.innerHTML = modalContent;
    
    // Add to DOM
    document.body.appendChild(this.modalContainer);
  }

  // 🎯 SETUP EVENT HANDLERS FOR MODAL BUTTONS
  setupModalHandlers(type, data) {
    if (!this.modalContainer) return;
    
    // Round end handlers
    const continueBtn = this.modalContainer.querySelector('#continue-round-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        this.hide();
        // Trigger round continuation
        if (typeof window.resumeNextRound === 'function') {
          window.resumeNextRound(data);
        }
      });
    }
    
    // Game over handlers
    const newGameBtn = this.modalContainer.querySelector('#new-game-btn');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => {
        this.hide();
        if (typeof initGame === 'function') {
          initGame();
        }
      });
    }
    
    const homeBtn = this.modalContainer.querySelector('#home-btn');
    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }
    
    // Error handlers
    const restartBtn = this.modalContainer.querySelector('#restart-game-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.hide();
        if (typeof initGame === 'function') {
          initGame();
        }
      });
    }
    
    // Generic close handlers
    const closeButtons = this.modalContainer.querySelectorAll('[id$="-close-btn"], [id$="-settings-btn"], [id$="-hint-btn"]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.hide());
    });
  }

  // ⏸️ PAUSE GAME DURING MODALS
  pauseGame() {
    // Set global pause flag
    window.gameIsPaused = true;
    
    // Disable game interactions
    const gameContainer = document.querySelector('.table');
    if (gameContainer) {
      gameContainer.style.pointerEvents = 'none';
      gameContainer.style.opacity = '0.7';
    }
    
    // Note if bot turn was in progress
    if (window.botTurnInProgress) {
      this.gameWasPaused = true;
    }
  }

  // ▶️ RESUME GAME AFTER MODAL
  resumeGame() {
    // Clear global pause flag
    window.gameIsPaused = false;
    
    // Re-enable game interactions
    const gameContainer = document.querySelector('.table');
    if (gameContainer) {
      gameContainer.style.pointerEvents = 'auto';
      gameContainer.style.opacity = '1';
    }
    
    // Resume bot turns if they were paused
    if (this.gameWasPaused && typeof scheduleNextBotTurn === 'function') {
      setTimeout(() => {
        scheduleNextBotTurn();
      }, 500);
    }

    this.gameWasPaused = false;
  }

  // 🔍 UTILITY FUNCTIONS
  isModalActive() {
    return this.activeModal !== null;
  }

  getActiveModalType() {
    return this.activeModal;
  }

  // 🎨 ENSURE MODAL STYLING
  ensureModalStyling() {
    if (document.getElementById('modal-manager-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'modal-manager-styles';
    styles.textContent = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .modal-overlay.show {
        opacity: 1;
      }
      
      .modal-overlay.hide {
        opacity: 0;
      }
      
      .game-modal {
        background: linear-gradient(145deg, #331E0F, #4A2B17);
        border: 3px solid #8B5A2B;
        border-radius: 15px;
        padding: 20px;
        max-width: 500px;
        width: 90%;
        color: #F5E8C7;
        font-family: 'Cabin', sans-serif;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        transform: scale(0.9);
        transition: transform 0.3s ease;
      }
      
      .modal-overlay.show .game-modal {
        transform: scale(1);
      }
      
      .modal-header h2 {
        margin: 0 0 15px 0;
        color: #D2A679;
        text-align: center;
        font-size: 1.4rem;
      }
      
      .modal-content {
        margin-bottom: 20px;
        line-height: 1.5;
      }
      
      .modal-actions {
        display: flex;
        gap: 15px;
        justify-content: center;
        flex-wrap: wrap;
      }
      
      .modal-actions button {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: 'Cabin', sans-serif;
      }
      
      .continue-btn {
        background: linear-gradient(145deg, #4A7043, #5A8A50);
        color: #F5E8C7;
      }
      
      .continue-btn:hover {
        background: linear-gradient(145deg, #5A8A50, #6A9A60);
        transform: translateY(-2px);
      }
      
      .restart-btn {
        background: linear-gradient(145deg, #8B5A2B, #A0622F);
        color: #F5E8C7;
      }
      
      .restart-btn:hover {
        background: linear-gradient(145deg, #A0622F, #B5722F);
        transform: translateY(-2px);
      }
      
      .home-btn {
        background: linear-gradient(145deg, #6B4B2B, #7B5B3B);
        color: #F5E8C7;
      }
      
      .home-btn:hover {
        background: linear-gradient(145deg, #7B5B3B, #8B6B4B);
        transform: translateY(-2px);
      }
      
      .score-grid {
        display: grid;
        gap: 10px;
        margin: 15px 0;
      }
      
      .score-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 12px;
        background: rgba(74, 43, 23, 0.3);
        border-radius: 6px;
        border: 1px solid #4A2B17;
      }
      
      .score-item.winner {
        border-color: #4A7043;
        background: rgba(74, 112, 67, 0.3);
      }
      
      .jackpot-announcement {
        background: linear-gradient(145deg, #FFD700, #FFA500);
        color: #331E0F;
        padding: 15px;
        border-radius: 10px;
        text-align: center;
        margin-bottom: 15px;
        font-weight: bold;
      }
      
      .jackpot-points {
        font-size: 1.2rem;
        color: #8B0000;
      }
      
      @media (max-width: 600px) {
        .game-modal {
          width: 95%;
          padding: 15px;
        }
        
        .modal-actions {
          flex-direction: column;
        }
        
        .modal-actions button {
          width: 100%;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
}

// 🌍 GLOBAL INSTANCE AND EXPORTS
window.ModalManager = ModalManager;

// Initialize modal styling when loaded
document.addEventListener('DOMContentLoaded', () => {
  if (window.modalManager) {
    window.modalManager.ensureModalStyling();
  }
});