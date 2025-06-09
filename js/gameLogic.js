/* 
 * Fixed gameLogic.js - Clean version without syntax errors
 * Adjusted for dual play area system:
 * - Simplified canCapture to support basic pair captures, as sum logic is handled in main.js.
 * - Added logic for bot turn continuation and deal-after-bots phase.
 */
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

function canCapture(handCard, board) {
  const captures = [];
  const handValue = valueMap[handCard.value] || parseInt(handCard.value);
  const isFaceCard = ['J', 'Q', 'K'].includes(handCard.value);

  board.forEach((card, index) => {
    if (card.value === handCard.value) {
      captures.push({ type: 'pair', cards: [index], target: card });
    }
  });

  return captures;
}

function scoreCards(cards) {
  return cards.reduce((total, card) => total + (pointsMap[card.value] || 0), 0);
}

// New function to handle bot turns after player is out
function processBotTurn(hand, board, difficulty) {
  const move = window.aiMove(hand, board, difficulty);
  if (move.action === 'capture') {
    const captures = window.canCapture(move.handCard, board);
    if (captures.length > 0) {
      return { action: 'capture', handCard: move.handCard, targetCards: captures[0].cards };
    }
  }
  return { action: 'place', handCard: move.handCard };
}

// New function to manage deal after bots
function dealAfterBots(players, deck) {
  if (deck.length >= players.length * 4) {
    for (let i = 0; i < players.length; i++) {
      players[i].hand = players[i].hand.concat(deck.splice(0, 4));
    }
  }
  return deck.length === 0; // Return true if deck is empty
}

window.canCapture = canCapture;
window.scoreCards = scoreCards;
window.processBotTurn = processBotTurn;
window.dealAfterBots = dealAfterBots;
window.pointsMap = pointsMap;
window.valueMap = valueMap;