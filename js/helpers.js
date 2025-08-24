/* 
 * 🔥 CONSOLIDATED HELPERS FOR STACKED! - ALL UTILITIES IN ONE PLACE
 * Contains: Deck Management + Game Logic + UI Utilities + Modal Systems
 * Consolidation: deck.js + gameLogic.js + utils.js → helpers.js
 */

// ============================================================================
// 🎴 DECK MANAGEMENT FUNCTIONS (from deck.js)
// ============================================================================

const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck() {
  return suits.flatMap(suit => values.map(value => ({
    suit,
    value,
    id: `${value}-${suit}`,
  })));
}

function shuffleDeck(deck) {
  const shuffled = [...deck];
  
  // 🎴 DOUBLE SHUFFLE for proper randomness
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Second shuffle pass
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  console.log('🎴 DECK SHUFFLED:', shuffled.slice(0, 5).map(c => c.value + c.suit));
  return shuffled;
}

function dealCards(deck, numPlayers = 3, cardsPerPlayer = 4, boardCards = 4) {
  const players = Array(numPlayers).fill().map(() => []);
  const board = [];
  let deckCopy = [...deck];

  for (let i = 0; i < cardsPerPlayer; i++) {
    for (let j = 0; j < numPlayers; j++) {
      players[j].push(deckCopy.shift());
    }
  }

  for (let i = 0; i < boardCards; i++) {
    board.push(deckCopy.shift());
  }

  return { players, board, remainingDeck: deckCopy };
}

// ============================================================================
// 🎯 GAME LOGIC FUNCTIONS (from gameLogic.js)
// ============================================================================

const pointsMap = {
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
};

const valueMap = {
  'A': 1,
  'K': 13,
  'Q': 12,
  'J': 11
};

// 🔥 COMPLETELY REWRITTEN canCapture() function with BOTH pair and sum logic
function canCapture(handCard, board) {
  const captures = [];
  const handValue = handCard.value === 'A' ? 1 : (parseInt(handCard.value) || valueMap[handCard.value]);
  const isFaceCard = ['J', 'Q', 'K'].includes(handCard.value);

  console.log(`🔍 CHECKING CAPTURES: ${handCard.value}${handCard.suit} (value=${handValue}) vs ${board.length} board cards`);

  // 🎯 PAIR CAPTURES: Find exact matches
  board.forEach((card, index) => {
    if (card.value === handCard.value) {
      captures.push({ 
        type: 'pair', 
        cards: [index], 
        target: card,
        handCard: handCard,
        score: 10 // Base score for pairs
      });
      console.log(`✅ PAIR FOUND: ${handCard.value}${handCard.suit} matches ${card.value}${card.suit} at index ${index}`);
    }
  });

  // 🎯 SUM CAPTURES: Only for number cards and Aces (NOT face cards)
  if (!isFaceCard && !isNaN(handValue)) {
    console.log(`🔍 CHECKING SUM CAPTURES for ${handCard.value} (value=${handValue})`);
    
    // Find all possible combinations that sum to handValue
    const boardNumerics = board.map((card, idx) => {
      const cardValue = card.value === 'A' ? 1 : parseInt(card.value);
      return {
        value: isNaN(cardValue) ? null : cardValue, // Face cards return null
        idx: idx,
        card: card
      };
    }).filter(item => item.value !== null); // Only include number cards and Aces
    
    console.log(`🔍 Board numerics:`, boardNumerics.map(item => `${item.card.value}(${item.value})`));
    
    // Check single card sums (most common)
    boardNumerics.forEach(boardItem => {
      if (boardItem.value === handValue) {
        captures.push({
          type: 'sum',
          cards: [boardItem.idx],
          targets: [boardItem.card],
          handCard: handCard,
          score: 8 // Sum captures worth slightly less than pairs
        });
        console.log(`✅ SUM FOUND: ${handCard.value}(${handValue}) = ${boardItem.card.value}(${boardItem.value})`);
      }
    });
    
    // Check two-card sums (like 2+3=5)
    for (let i = 0; i < boardNumerics.length; i++) {
      for (let j = i + 1; j < boardNumerics.length; j++) {
        const sum = boardNumerics[i].value + boardNumerics[j].value;
        if (sum === handValue) {
          captures.push({
            type: 'sum',
            cards: [boardNumerics[i].idx, boardNumerics[j].idx],
            targets: [boardNumerics[i].card, boardNumerics[j].card],
            handCard: handCard,
            score: 12 // Multi-card sums worth more
          });
          console.log(`✅ TWO-CARD SUM: ${handCard.value}(${handValue}) = ${boardNumerics[i].card.value}(${boardNumerics[i].value}) + ${boardNumerics[j].card.value}(${boardNumerics[j].value})`);
        }
      }
    }
    
    // Check three-card sums (like 1+2+2=5)
    for (let i = 0; i < boardNumerics.length; i++) {
      for (let j = i + 1; j < boardNumerics.length; j++) {
        for (let k = j + 1; k < boardNumerics.length; k++) {
          const sum = boardNumerics[i].value + boardNumerics[j].value + boardNumerics[k].value;
          if (sum === handValue) {
            captures.push({
              type: 'sum',
              cards: [boardNumerics[i].idx, boardNumerics[j].idx, boardNumerics[k].idx],
              targets: [boardNumerics[i].card, boardNumerics[j].card, boardNumerics[k].card],
              handCard: handCard,
              score: 15 // Three-card sums worth most
            });
            console.log(`✅ THREE-CARD SUM: ${handCard.value}(${handValue}) = ${boardNumerics[i].card.value} + ${boardNumerics[j].card.value} + ${boardNumerics[k].card.value}`);
          }
        }
      }
    }
  }

  console.log(`🎯 TOTAL CAPTURES FOUND: ${captures.length} for ${handCard.value}${handCard.suit}`);
  return captures;
}

function scoreCards(cards) {
  return cards.reduce((total, card) => total + (pointsMap[card.value] || 0), 0);
}

// ============================================================================
// 🎮 UI UTILITY SYSTEMS (from utils.js)
// ============================================================================

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

// 🎯 CLEAN SCORE BREAKDOWN - Much more subtle
function createScoreBreakdown(player, jackpotInfo) {
  const isJackpotWinner = jackpotInfo && jackpotInfo.winner === player.name;
  
  if (!isJackpotWinner) {
    return `<span class="scoreboard-score">${player.score} pts</span>`;
  }
  
  const baseScore = player.score - jackpotInfo.bonusPoints;
  return `
    <div class="jackpot-winner-score-clean">
      <span class="final-score-clean">${player.score} pts</span>
      <span class="score-breakdown-clean">
        (${baseScore} + <span class="jackpot-bonus-small">🏆${jackpotInfo.bonusPoints}</span>)
      </span>
    </div>
  `;
}

// 🎉 CLEAN & PROFESSIONAL JACKPOT ANNOUNCEMENT
function createJackpotAnnouncement(jackpotInfo) {
  if (!jackpotInfo) return '';
  
  return `
    <div class="jackpot-announcement-clean">
      <span class="jackpot-icon-small">🏆</span>
      <span class="jackpot-text">
        <strong>${jackpotInfo.winner}</strong> swept ${jackpotInfo.cardsCount} remaining cards! 
        <span class="jackpot-bonus-clean">+${jackpotInfo.bonusPoints} pts</span>
      </span>
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

    // Show the COMPLETED round number (current round = actual completed round)
const completedRound = game.currentRound;
titleEl.textContent = `Round ${completedRound} Complete!`;

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

// function dealNewRound() {
//   // DEPRECATED: GameStateManager handles new rounds
//   console.log('🚨 dealNewRound() called - should use GameStateManager instead');
// }

// ============================================================================
// 🌍 GLOBAL EXPORTS - Make everything available globally
// ============================================================================

// Make utility classes globally available
window.DraggableModal = DraggableModal;
window.sounds = sounds;
window.initSounds = initSounds;
window.showRoundEndModal = showRoundEndModal;
window.showGameOverModal = showGameOverModal;
window.parseJackpotMessage = parseJackpotMessage;
window.createScoreBreakdown = createScoreBreakdown;
window.createJackpotAnnouncement = createJackpotAnnouncement;
window.rankPlayers = rankPlayers;
window.createConfetti = createConfetti;

// Make sure playSound function exists globally (referenced in main.js)
window.playSound = function(type) {
  if (window.sounds && window.sounds[type]) {
    window.sounds[type].play().catch(e => console.error('Sound play failed:', e));
  }
};

console.log('🔥 HELPERS.JS LOADED - All utilities consolidated and ready!');