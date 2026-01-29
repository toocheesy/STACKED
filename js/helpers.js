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

// 🔥 REPLACE shuffleDeck() FUNCTION:
function shuffleDeck(deck) {
  const shuffled = [...deck];
  
  // 🎯 FISHER-YATES SHUFFLE - TRUE RANDOMIZATION
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Generate truly random index
    const j = Math.floor(Math.random() * (i + 1));
    
    // Swap elements
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

// 🔥 ALSO ADD: Enhanced deck creation for better distribution
function createDeck() {
  const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];
  
  // Create cards in alternating pattern for better initial distribution
  values.forEach(value => {
    suits.forEach(suit => {
      deck.push({
        value,
        suit,
        id: `${value}${suit}`
      });
    });
  });
  
  return deck;
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
    }
  });

  // 🎯 SUM CAPTURES: Only for number cards and Aces (NOT face cards)
  if (!isFaceCard && !isNaN(handValue)) {
    const boardNumerics = board.map((card, idx) => {
      const cardValue = card.value === 'A' ? 1 : parseInt(card.value);
      return {
        value: isNaN(cardValue) ? null : cardValue,
        idx: idx,
        card: card
      };
    }).filter(item => item.value !== null);

    // Check single card sums
    boardNumerics.forEach(boardItem => {
      if (boardItem.value === handValue) {
        captures.push({
          type: 'sum',
          cards: [boardItem.idx],
          targets: [boardItem.card],
          handCard: handCard,
          score: 8
        });
      }
    });

    // Check two-card sums
    for (let i = 0; i < boardNumerics.length; i++) {
      for (let j = i + 1; j < boardNumerics.length; j++) {
        const sum = boardNumerics[i].value + boardNumerics[j].value;
        if (sum === handValue) {
          captures.push({
            type: 'sum',
            cards: [boardNumerics[i].idx, boardNumerics[j].idx],
            targets: [boardNumerics[i].card, boardNumerics[j].card],
            handCard: handCard,
            score: 12
          });
        }
      }
    }

    // Check three-card sums
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
              score: 15
            });
          }
        }
      }
    }
  }

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

// Sound System
const sounds = {
  capture: new Audio('./audio/capture.mp3'),
  invalid: new Audio('./audio/invalid.mp3'),
  winner: new Audio('./audio/winner.mp3'),
  jackpot: new Audio('./audio/jackpot.mp3')
};

Object.values(sounds).forEach(audio => {
  audio.preload = 'auto';
  audio.volume = 0.7;
});

// Unlock audio on first user interaction (browser autoplay policy)
let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  Object.values(sounds).forEach(audio => {
    audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {});
  });
  document.removeEventListener('click', unlockAudio);
  document.removeEventListener('touchstart', unlockAudio);
}
document.addEventListener('click', unlockAudio);
document.addEventListener('touchstart', unlockAudio);

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

function dealNewRound() {
  // 🔥 FIXED: Use proper dealer rotation from game engine
  game.currentRound++;
  
  try {
    const newDeck = shuffleDeck(createDeck());
    const dealResult = dealCards(newDeck, 3, 4, 4);
    game.state.hands = dealResult.players;
    game.state.board = dealResult.board;
    game.state.deck = dealResult.remainingDeck;
    // 🔥 FIXED: Don't override currentPlayer - rotateDealerClockwise() already set it correctly
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

// ============================================================================
// 🌍 GLOBAL EXPORTS - Make everything available globally
// ============================================================================

// Make utility classes globally available
window.DraggableModal = DraggableModal;
window.sounds = sounds;
window.dealNewRound = dealNewRound;
window.parseJackpotMessage = parseJackpotMessage;
window.createScoreBreakdown = createScoreBreakdown;
window.createJackpotAnnouncement = createJackpotAnnouncement;
window.rankPlayers = rankPlayers;
window.createConfetti = createConfetti;

// Global playSound - main.js defines a local version with settings check
window.playSound = function(type) {
  if (window.sounds && window.sounds[type]) {
    window.sounds[type].currentTime = 0;
    window.sounds[type].play().catch(e => {
      console.warn('Sound play failed:', type, e.message);
    });
  }
};