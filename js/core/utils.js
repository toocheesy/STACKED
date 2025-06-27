/* 
 * Missing Utility Systems for STACKED!
 * Smart Messages, Draggable Modals, and Sound System
 */

// Smart Contextual Error Detection System
class SmartMessageSystem {
  constructor() {
    this.messageElement = document.getElementById('smart-message');
    this.defaultMessage = "Drag cards to build captures or place one on board to end turn • Score 500 to win!";
    this.currentTimeout = null;
  }

  updateMessage(gameState = 'default') {
    let message = this.getContextualMessage(gameState);
    this.showMessage(message);
  }

  getContextualMessage(context) {
    switch(context) {
      case 'turn_start':
        return "Drag cards to build captures or place one on board to end turn";
      case 'cards_in_areas':
        return "Submit your capture or reset to try again";
      case 'game_over_player':
        return "🎉 Game Over! You win! 🎉";
      case 'game_over_bot':
        return "Game Over! Bot wins this round - try again!";
      case 'valid_combo':
        return "✅ Valid combo! Click Submit Move to capture";
      default:
        return this.defaultMessage;
    }
  }

  showErrorMessage(errorText) {
    this.showMessage(`❌ ${errorText}`, 'error');
    if (typeof playSound === 'function') {
      playSound('invalid');
    }
  }

  showSuccessMessage(successText) {
    this.showMessage(`✅ ${successText}`, 'success');
  }

  showMessage(text, type = 'normal') {
    if (!this.messageElement) return;
    
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }

    this.messageElement.textContent = text;
    this.messageElement.className = 'smart-message';
    if (type === 'error') {
      this.messageElement.classList.add('error-message');
    } else if (type === 'success') {
      this.messageElement.classList.add('success-message');
    }

    if (type !== 'normal') {
      this.currentTimeout = setTimeout(() => {
        this.updateMessage('default');
        this.messageElement.className = 'smart-message';
      }, 3000);
    }
  }
}

// Draggable Modal System
class DraggableModal {
  constructor(elementId) {
    this.modal = document.getElementById(elementId);
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.initialX = 0;
    this.initialY = 0;
    
    if (this.modal) {
      this.init();
    }
  }
  
  init() {
    const titleBar = this.modal.querySelector('.modal-title');
    if (titleBar) {
      titleBar.style.cursor = 'move';
      titleBar.addEventListener('mousedown', (e) => this.startDrag(e));
    }
    
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.stopDrag());
  }
  
  startDrag(e) {
    this.isDragging = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    
    const rect = this.modal.getBoundingClientRect();
    this.initialX = rect.left;
    this.initialY = rect.top;
    
    this.modal.style.transition = 'none';
  }
  
  drag(e) {
    if (!this.isDragging) return;
    
    e.preventDefault();
    
    const deltaX = e.clientX - this.startX;
    const deltaY = e.clientY - this.startY;
    
    const newX = this.initialX + deltaX;
    const newY = this.initialY + deltaY;
    
    const maxX = window.innerWidth - this.modal.offsetWidth;
    const maxY = window.innerHeight - this.modal.offsetHeight;
    
    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));
    
    this.modal.style.left = boundedX + 'px';
    this.modal.style.top = boundedY + 'px';
    this.modal.style.right = 'auto';
  }
  
  stopDrag() {
    this.isDragging = false;
    this.modal.style.transition = '';
  }
}

// Sound System - Updated to match your actual audio files
const sounds = {
  capture: new Audio('./audio/capture.mp3'),
  invalid: new Audio('./audio/invalid.mp3'),
  winner: new Audio('./audio/winner.mp3'),
  jackpot: new Audio('./audio/jackpot.mp3')
};

// Initialize sound system
function initSounds() {
  // Preload all sounds for better performance
  Object.values(sounds).forEach(audio => {
    audio.preload = 'auto';
    audio.volume = 0.7; // Set reasonable volume
  });
  console.log('🔊 Sound system initialized');
}

// Modal Systems for Round End and Game Over
function rankPlayers(gameEngine) {
  return gameEngine.getRankedPlayers();
}

function createConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.animationDelay = `${Math.random() * 2}s`;
    container.appendChild(confetti);
  }
}

function showRoundEndModal(endResult) {
  const modal = document.getElementById('scoreboard-modal');
  if (!modal) return;

  const jackpotEl = document.getElementById('jackpot-message');
  const titleEl = document.getElementById('scoreboard-title');
  const listEl = document.getElementById('scoreboard-list');
  const buttonsEl = document.getElementById('scoreboard-buttons');
  const confettiEl = document.getElementById('confetti-container');

  if (jackpotEl && titleEl && listEl && buttonsEl && confettiEl) {
    jackpotEl.textContent = endResult.message || '';
    jackpotEl.classList.toggle('visible', !!endResult.message);
    titleEl.textContent = `Round ${game.currentRound} Scores`;
    confettiEl.classList.remove('active');

    const rankedPlayers = rankPlayers(game);
    listEl.innerHTML = rankedPlayers.map((player, index) => `
      <div class="scoreboard-item ${index === 0 ? 'leader' : ''}">
        <span class="scoreboard-rank">${['🥇', '🥈', '🥉'][index] || ''}</span>
        <span class="scoreboard-name">${player.name}</span>
        <span class="scoreboard-score">${player.score} pts</span>
      </div>
    `).join('');

    buttonsEl.innerHTML = `
      <button id="next-round-btn">Next Round</button>
    `;

    modal.showModal();
    playSound('jackpot');

    const nextRoundBtn = document.getElementById('next-round-btn');
    if (nextRoundBtn) {
      nextRoundBtn.addEventListener('click', () => {
        modal.close();
        dealNewRound();
      });
    }
  }
}

function showGameOverModal(endResult) {
  const modal = document.getElementById('scoreboard-modal');
  if (!modal) return;

  const jackpotEl = document.getElementById('jackpot-message');
  const titleEl = document.getElementById('scoreboard-title');
  const listEl = document.getElementById('scoreboard-list');
  const buttonsEl = document.getElementById('scoreboard-buttons');
  const confettiEl = document.getElementById('confetti-container');

  if (jackpotEl && titleEl && listEl && buttonsEl && confettiEl) {
    jackpotEl.textContent = endResult.message || '';
    jackpotEl.classList.toggle('visible', !!endResult.message);
    titleEl.textContent = 'Game Over!';
    createConfetti();
    confettiEl.classList.add('active');

    const rankedPlayers = rankPlayers(game);
    listEl.innerHTML = rankedPlayers.map((player, index) => `
      <div class="scoreboard-item ${index === 0 ? 'leader' : ''}">
        <span class="scoreboard-rank">${['🥇', '🥈', '🥉'][index] || ''}</span>
        <span class="scoreboard-name">${player.name}</span>
        <span class="scoreboard-score">${player.score} pts</span>
      </div>
    `).join('');

    buttonsEl.innerHTML = `
      <button id="new-game-btn">New Game</button>
    `;

    modal.showModal();
    playSound('winner');

    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => {
        modal.close();
        initGame();
      });
    }
  }
}

function dealNewRound() {
  game.currentDealer = (game.currentDealer + 1) % 3;
  game.currentRound++;
  
  try {
    const newDeck = shuffleDeck(createDeck());
    const dealResult = dealCards(newDeck, 3, 4, 4);
    game.state.hands = dealResult.players;
    game.state.board = dealResult.board;
    game.state.deck = dealResult.remainingDeck;
    game.state.currentPlayer = 0;
    game.state.lastCapturer = null;
    ui.smartMessages.updateMessage('turn_start');
    ui.render();
  } catch (e) {
    console.error('Error dealing new round:', e);
    ui.smartMessages.showErrorMessage('Error dealing cards! Restart the game.');
  }
}

// Export all utility classes
window.SmartMessageSystem = SmartMessageSystem;
window.DraggableModal = DraggableModal;
window.sounds = sounds;
window.showRoundEndModal = showRoundEndModal;
window.showGameOverModal = showGameOverModal;
window.dealNewRound = dealNewRound;