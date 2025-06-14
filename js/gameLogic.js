// gameLogic.js - Modularized Logic
import { logDebug } from './debug.js'; // Changed from debugLog to logDebug

export const pointsMap = {
  'A': 15, 'K': 10, 'Q': 10, 'J': 10, '10': 10,
  '9': 5, '8': 5, '7': 5, '6': 5, '5': 5,
  '4': 5, '3': 5, '2': 5
};

export const valueMap = {
  'A': 1, 'K': 13, 'Q': 12, 'J': 11
};

export function scoreCards(cards) {
  return cards.reduce((sum, card) => sum + (pointsMap[card.value] || 0), 0);
}

export function processBotTurn(hand, board, difficulty) {
  logDebug('Processing bot turn...', { hand, board, difficulty });
  // Simplified: Use a basic move since aiMove isn't defined
  const move = { handCard: hand[0] }; // Default to first card
  if (difficulty === 'beginner') {
    const captures = window.canCapture ? window.canCapture(move.handCard, board) : [];
    if (captures.length > 0) {
      return { action: 'capture', handCard: move.handCard, targetCards: captures[0].cards };
    }
  }
  return { action: 'place', handCard: move.handCard };
}

export function dealAfterBots(players, deck) {
  logDebug('Dealing after bots...', deck.length);
  const numPlayers = players.length;
  const dealCount = 4;
  if (deck.length >= numPlayers * dealCount) {
    for (let i = 0; i < numPlayers; i++) {
      players[i].hand = [...players[i].hand, ...deck.splice(0, dealCount)];
    }
  }
  logDebug('Remaining deck:', deck.length);
  return deck.length === 0;
}