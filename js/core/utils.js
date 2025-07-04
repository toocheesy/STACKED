/* 
 * Updated Utility Systems for STACKED!
 * 🔥 OLD SmartMessageSystem REMOVED - NOW USING CENTRALIZED MESSAGE CONTROLLER
 * Draggable Modals, Sound System, and Game Over Modals
 * 🏆 ENHANCED WITH EPIC JACKPOT WINNER DISPLAY!
 */

// 🚨 OLD SmartMessageSystem REMOVED - REPLACED WITH MessageController!

// Draggable Modal System (KEPT)
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

// Sound System (KEPT)
const sounds = {
  capture: new Audio('./audio/capture.mp3'),
  invalid: new Audio('./audio/invalid.mp3'),
  winner: new Audio('./audio/winner.mp3'),
  jackpot: new Audio('./audio/jackpot.mp3')
};

function initSounds() {
  Object.values(sounds).forEach(audio => {
    audio.preload = 'auto';
    audio.volume = 0.7;
  });
  console.log('🔊 Sound system initialized');
}

// Modal Systems (UPDATED WITH EPIC JACKPOT DISPLAY!)
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

// 🏆 EPIC JACKPOT PARSER - Extracts winner and bonus from message
function parseJackpotMessage(message) {
  if (!message) return null;
  
  // Parse messages like "🏆 Player sweeps 3 remaining cards! +45 pts"
  const jackpotMatch = message.match(/🏆\s+(\w+(?:\s+\d+)?)\s+sweeps\s+(\d+)\s+remaining\s+cards!\s+\+(\d+)\s+pts/);
  
  if (jackpotMatch) {
    return {
      winner: jackpotMatch[1],
      cardsCount: parseInt(jackpotMatch[2]),
      bonusPoints: parseInt(jackpotMatch[3])
    };
  }
  
  return null;
}

// 🎯 EPIC SCORE BREAKDOWN - Shows base + jackpot bonus
function createScoreBreakdown(player, jackpotInfo) {
  if (!jackpotInfo || jackpotInfo.winner !== player.name) {
    return `<span class="scoreboard-score">${player.score} pts</span>`;
  }
  
  const baseScore = player.score - jackpotInfo.bonusPoints;
  return `
    <span class="scoreboard-score jackpot-winner-score">
      ${player.score} pts
      <span class="score-breakdown">(Base: ${baseScore} + Jackpot: ${jackpotInfo.bonusPoints})</span>
    </span>
  `;
}

function showRoundEndModal(endResult) {
  const modal = document.getElementById('scoreboard-modal');
  if (!modal) return;

  // 🎯 SEND ROUND END EVENT TO MESSAGE CONTROLLER
  window.messageController.handleGameEvent('ROUND_END', {
    message: endResult.message,
    roundNumber: game.currentRound
  });

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

  // 🏆 PARSE JACKPOT INFORMATION
  const jackpotInfo = parseJackpotMessage(endResult.message);
  const rankedPlayers = rankPlayers(game);
  const winner = rankedPlayers[0];

  // 🎯 SEND GAME OVER EVENT TO MESSAGE CONTROLLER
  window.messageController.handleGameEvent('GAME_OVER', {
    winner: winner.name,
    message: endResult.message
  });

  const jackpotEl = document.getElementById('jackpot-message');
  const titleEl = document.getElementById('scoreboard-title');
  const listEl = document.getElementById('scoreboard-list');
  const buttonsEl = document.getElementById('scoreboard-buttons');
  const confettiEl = document.getElementById('confetti-container');

  if (jackpotEl && titleEl && listEl && buttonsEl && confettiEl) {
    // 🏆 DISPLAY EPIC JACKPOT MESSAGE
    if (jackpotInfo) {
      jackpotEl.innerHTML = `
        <div class="jackpot-announcement">
          🏆 <strong>${jackpotInfo.winner}</strong> swept the board! 
          <span class="jackpot-bonus">+${jackpotInfo.bonusPoints} pts</span> 
          from ${jackpotInfo.cardsCount} remaining cards! 🎰
        </div>
      `;
      jackpotEl.classList.add('visible', 'jackpot-highlight');
    } else {
      jackpotEl.textContent = endResult.message || '';
      jackpotEl.classList.toggle('visible', !!endResult.message);
      jackpotEl.classList.remove('jackpot-highlight');
    }

    titleEl.textContent = 'Game Over!';
    createConfetti();
    confettiEl.classList.add('active');

    // 🎯 EPIC SCOREBOARD WITH JACKPOT WINNER HIGHLIGHTING
    listEl.innerHTML = rankedPlayers.map((player, index) => {
      const isJackpotWinner = jackpotInfo && jackpotInfo.winner === player.name;
      const scoreBreakdown = createScoreBreakdown(player, jackpotInfo);
      
      return `
        <div class="scoreboard-item ${index === 0 ? 'leader' : ''} ${isJackpotWinner ? 'jackpot-winner' : ''}">
          <span class="scoreboard-rank">${['🥇', '🥈', '🥉'][index] || ''}</span>
          <span class="scoreboard-name">
            ${player.name}
            ${isJackpotWinner ? '<span class="jackpot-crown">👑</span>' : ''}
          </span>
          ${scoreBreakdown}
        </div>
      `;
    }).join('');

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
    
    // 🎯 SEND NEW ROUND EVENT TO MESSAGE CONTROLLER
    window.messageController.handleGameEvent('NEW_ROUND', {
      roundNumber: game.currentRound
    });
    
    ui.render();
  } catch (e) {
    console.error('Error dealing new round:', e);
    
    // 🎯 SEND ERROR EVENT TO MESSAGE CONTROLLER
    window.messageController.handleGameEvent('CAPTURE_ERROR', {
      message: 'Error dealing cards! Restart the game.'
    });
  }
}

// Export utility classes (REMOVED SmartMessageSystem)
window.DraggableModal = DraggableModal;
window.sounds = sounds;
window.showRoundEndModal = showRoundEndModal;
window.showGameOverModal = showGameOverModal;
window.dealNewRound = dealNewRound;