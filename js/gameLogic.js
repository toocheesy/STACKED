// gameLogic.js - Modularized Logic
import { debugLog } from './debug.js';

const pointsMap = {
  'A': 15, 'K': 10, 'Q': 10, 'J': 10, '10': 10,
  '9': 5, '8': 5, '7': 5, '6': 5, '5': 5,
  '4': 5, '3': 5, '2': 5
};

const valueMap = {
  'A': 1, 'K': 13, 'Q': 12, 'J': 11
};

function canCapture(handCard, board) {
  const captures = [];
  const handValue = valueMap[handCard.value] || parseInt(handCard.value);
  board.forEach((card, i) => {
    if (card.value === handCard.value) {
      captures.push({ type: 'pair', cards: [i], target: card });
    }
  });
  return captures;
}

function scoreCards(cards) {
  return cards.reduce((sum, card) => sum + (pointsMap[card.value] || 0), 0);
}

function processBotTurn(hand, board, difficulty) {
  const move = window.aiMove(hand, board, difficulty);
  if (move?.action === 'capture') {
    const captures = canCapture(move.handCard, board);
    if (captures.length > 0) {
      return { action: 'capture', handCard: move.handCard, targetCards: captures[0].cards };
    }
  }
  return { action: 'place', handCard: move.handCard };
}

function dealAfterBots(players, deck) {
  debugLog('Dealing after bots...', deck.length);
  const numPlayers = players.length;
  const dealCount = 4;
  if (deck.length >= numPlayers * dealCount) {
    for (let i = 0; i < numPlayers; i++) {
      players[i].hand = [...players[i].hand, ...deck.splice(0, dealCount)];
    }
  }
  debugLog('Remaining deck:', deck.length);
  return deck.length === 0;
}

window.canCapture = canCapture;
window.scoreCards = scoreCards;
window.processBotTurn = processBotTurn;
window.dealAfterBots = dealAfterBots;
window.pointsMap = pointsMap;
window.valueMap = valueMap;
