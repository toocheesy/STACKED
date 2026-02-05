/*
 * STACKED! Helpers
 * Constants, deck management, game logic, AI routing
 */

// ============================================================================
// 📋 SHARED CONSTANTS (from constants.js)
// ============================================================================

const POINTS_MAP = {
  'A': 15, 'K': 10, 'Q': 10, 'J': 10, '10': 10,
  '9': 5, '8': 5, '7': 5, '6': 5, '5': 5, '4': 5, '3': 5, '2': 5
};

const PLAYER_NAMES = ['Player', 'Bot 1', 'Bot 2'];

function calculateScore(cards) {
  return cards.reduce((total, card) => total + (POINTS_MAP[card.value] || 0), 0);
}

function getPointValue(card) {
  return POINTS_MAP[card.value] || 0;
}

window.POINTS_MAP = POINTS_MAP;
window.PLAYER_NAMES = PLAYER_NAMES;
window.calculateScore = calculateScore;
window.getPointValue = getPointValue;

// ============================================================================
// 🎴 DECK MANAGEMENT FUNCTIONS (from deck.js)
// ============================================================================

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

// ============================================================================
// 🤖 AI MOVE ROUTER (from ai.js)
// ============================================================================

const personalities = {
  calvin: () => window.Calvin,
  nina: () => window.Nina,
  rex: () => window.Rex
};

function getPersonality(name) {
  const getter = personalities[name];
  if (getter) {
    const p = getter();
    if (p) return p;
  }
  console.warn('Personality not found:', name, '- falling back to Nina');
  return window.Nina;
}

function getThinkingDelay(personalityName) {
  const bot = getPersonality(personalityName);
  const min = bot.thinkingDelay.min;
  const max = bot.thinkingDelay.max;
  return min + Math.random() * (max - min);
}

function aiMove(hand, board, personalityName, gameState) {
  if (!hand || hand.length === 0) return null;
  if (!board) board = [];
  const bot = getPersonality(personalityName);
  return bot.decide(hand, board, gameState || {});
}
