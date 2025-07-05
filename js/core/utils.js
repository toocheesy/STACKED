/* 
 * 🔥 ENHANCED UTILITY SYSTEMS FOR STACKED! - EPIC JACKPOT WINNER EDITION!
 * 🏆 NOW WITH LEGENDARY JACKPOT WINNER DISPLAY AND SCORE BREAKDOWNS!
 * Draggable Modals, Sound System, and EPIC Game Over Modals
 */

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

// Modal Systems (🏆 ENHANCED WITH EPIC JACKPOT DISPLAY!)
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
  
  console.log(`🏆 PARSING JACKPOT MESSAGE: "${message}"`);
  
  // Parse messages like "🏆 Player sweeps 3 remaining cards! +45 pts"
  const jackpotMatch = message.match(/🏆\s+(\w+(?:\s+\d+)?)\s+sweeps\s+(\d+)\s+remaining\s+cards!\s+\+(\d+)\s+pts/);
  
  if (jackpotMatch) {
    const result = {
      winner: jackpotMatch[1],
      cardsCount: parseInt(jackpotMatch[2]),
      bonusPoints: parseInt(jackpotMatch[3])
    };
    console.log(`✅ JACKPOT PARSED:`, result);
    return result;
  }
  
  console.log(`❌ NO JACKPOT PATTERN FOUND`);
  return null;
}

// 🎯 EPIC SCORE BREAKDOWN - Shows base + jackpot bonus with golden styling
function createScoreBreakdown(player, jackpotInfo) {
  const isJackpotWinner = jackpotInfo && jackpotInfo.winner === player.name;
  
  if (!isJackpotWinner) {
    return `<span class="scoreboard-score">${player.score} pts</span>`;
  }
  
  const baseScore = player.score - jackpotInfo.bonusPoints;
  return `
    <div class="jackpot-winner-score">
      <span class="final-score">${player.score} pts</span>
      <div class="score-breakdown">
        <span class="base-score">Base: ${baseScore}</span>
        <span class="jackpot-bonus">🏆 Jackpot: +${jackpotInfo.bonusPoints}</span>
      </div>
    </div>
  `;
}

// 🎉 CREATE EPIC JACKPOT ANNOUNCEMENT
function createJackpotAnnouncement(jackpotInfo) {
  if (!jackpotInfo) return '';
  
  return `
    <div class="jackpot-announcement">
      <div class="jackpot-header">
        <span class="jackpot-icon">🏆</span>
        <span class="jackpot-title">JACKPOT WINNER!</span>
        <span class="jackpot-icon">🏆</span>
      </div>
      <div class="jackpot-details">
        <strong>${jackpotInfo.winner}</strong> swept the board clean!
      </div>
      <div class="jackpot-bonus-display">
        <span class="bonus-cards">${jackpotInfo.cardsCount} cards</span>
        <span class="bonus-arrow">→</span>
        <span class="bonus-points">+${jackpotInfo.bonusPoints} pts</span>
      </div>
      <div class="jackpot-celebration">🎰 LAST COMBO TAKES ALL! 🎰</div>
    </div>
  `;
}

// 🏆 ENHANCED ROUND END MODAL - Now with jackpot celebration
function showRoundEndModal(endResult) {
  const modal = document.getElementById('scoreboard-modal');
  if (!modal) return;

  console.log(`🏆 SHOWING ROUND END MODAL WITH RESULT:`, endResult);

  // 🏆 PARSE JACKPOT INFORMATION
  const jackpotInfo = parseJackpotMessage(endResult.message);
  const rankedPlayers = rankPlayers(game);

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
    // 🏆 DISPLAY EPIC JACKPOT ANNOUNCEMENT
    if (jackpotInfo) {
      jackpotEl.innerHTML = createJackpotAnnouncement(jackpotInfo);
      jackpotEl.classList.add('visible', 'jackpot-celebration');
      console.log(`🎉 JACKPOT ANNOUNCEMENT CREATED FOR: ${jackpotInfo.winner}`);
    } else {
      jackpotEl.innerHTML = endResult.message ? `<div class="round-message">${endResult.message}</div>` : '';
      jackpotEl.classList.toggle('visible', !!endResult.message);
      jackpotEl.classList.remove('jackpot-celebration');
    }

    titleEl.textContent = `Round ${game.currentRound} Complete!`;
    confettiEl.classList.remove('active');

    // 🎯 EPIC SCOREBOARD WITH JACKPOT WINNER HIGHLIGHTING
    listEl.innerHTML = rankedPlayers.map((player, index) => {
      const isJackpotWinner = jackpotInfo && jackpotInfo.winner === player.name;
      const scoreBreakdown = createScoreBreakdown(player, jackpotInfo);
      
      return `
        <div class="scoreboard-item ${index === 0 ? 'leader' : ''} ${isJackpotWinner ? 'jackpot-winner' : ''}">
          <span class="scoreboard-rank">${['🥇', '🥈', '🥉'][index] || `#${index + 1}`}</span>
          <div class="player-info">
            <span class="scoreboard-name">
              ${player.name}
              ${isJackpotWinner ? '<span class="jackpot-crown">👑</span>' : ''}
            </span>
            ${scoreBreakdown}
          </div>
        </div>
      `;
    }).join('');

    buttonsEl.innerHTML = `
      <button id="next-round-btn" class="continue-btn">Continue to Next Round</button>
    `;

    modal.showModal();
    
    // 🔊 EPIC JACKPOT SOUND
    if (jackpotInfo) {
      playSound('jackpot');
    } else {
      playSound('winner');
    }

    const nextRoundBtn = document.getElementById('next-round-btn');
    if (nextRoundBtn) {
      nextRoundBtn.addEventListener('click', () => {
        modal.close();
        dealNewRound();
      });
    }
  }
}

// 🏆 ENHANCED GAME OVER MODAL - Ultimate jackpot celebration
function showGameOverModal(endResult) {
  const modal = document.getElementById('scoreboard-modal');
  if (!modal) return;

  console.log(`🏆 SHOWING GAME OVER MODAL WITH RESULT:`, endResult);

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
    // 🏆 DISPLAY EPIC JACKPOT ANNOUNCEMENT
    if (jackpotInfo) {
      jackpotEl.innerHTML = createJackpotAnnouncement(jackpotInfo);
      jackpotEl.classList.add('visible', 'jackpot-celebration');
      console.log(`🎉 FINAL JACKPOT ANNOUNCEMENT CREATED FOR: ${jackpotInfo.winner}`);
    } else {
      jackpotEl.innerHTML = endResult.message ? `<div class="game-end-message">${endResult.message}</div>` : '';
      jackpotEl.classList.toggle('visible', !!endResult.message);
      jackpotEl.classList.remove('jackpot-celebration');
    }

    // 🏆 EPIC GAME OVER TITLE
    const gameOverTitle = jackpotInfo ? 
      `🏆 ${winner.name} Wins with Epic Jackpot! 🏆` : 
      `🎉 Game Over - ${winner.name} Wins! 🎉`;
    
    titleEl.textContent = gameOverTitle;
    createConfetti();
    confettiEl.classList.add('active');

    // 🎯 ULTIMATE SCOREBOARD WITH JACKPOT WINNER HIGHLIGHTING
    listEl.innerHTML = rankedPlayers.map((player, index) => {
      const isJackpotWinner = jackpotInfo && jackpotInfo.winner === player.name;
      const scoreBreakdown = createScoreBreakdown(player, jackpotInfo);
      
      return `
        <div class="scoreboard-item ${index === 0 ? 'leader' : ''} ${isJackpotWinner ? 'jackpot-winner ultimate-winner' : ''}">
          <span class="scoreboard-rank">${['🥇', '🥈', '🥉'][index] || `#${index + 1}`}</span>
          <div class="player-info">
            <span class="scoreboard-name">
              ${player.name}
              ${index === 0 ? '<span class="winner-crown">👑</span>' : ''}
              ${isJackpotWinner ? '<span class="jackpot-crown">🎰</span>' : ''}
            </span>
            ${scoreBreakdown}
          </div>
        </div>
      `;
    }).join('');

    buttonsEl.innerHTML = `
      <button id="new-game-btn" class="new-game-btn">Start New Game</button>
      <button id="home-btn" class="home-btn">Return to Homepage</button>
    `;

    modal.showModal();
    
    // 🔊 EPIC VICTORY SOUND
    if (jackpotInfo) {
      playSound('jackpot');
      setTimeout(() => playSound('winner'), 1000); // Double celebration!
    } else {
      playSound('winner');
    }

    const newGameBtn = document.getElementById('new-game-btn');
    const homeBtn = document.getElementById('home-btn');
    
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => {
        modal.close();
        initGame();
      });
    }
    
    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        modal.close();
        window.location.href = 'index.html';
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

// Export utility classes
window.DraggableModal = DraggableModal;
window.sounds = sounds;
window.showRoundEndModal = showRoundEndModal;
window.showGameOverModal = showGameOverModal;
window.dealNewRound = dealNewRound;