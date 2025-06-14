// index.js - App Entry Point
import './debug.js';
import './captureLogic.js';
import './turnManager.js';
import './gameLogic.js';
import { initializeGame } from './main.js';
import { createDeck, shuffleDeck, dealCards } from './deck.js';
import { setupAI } from './ai.js';

console.log('%cSTACKED! Initialized', 'color: limegreen; font-weight: bold');

document.addEventListener('DOMContentLoaded', () => {
  const deck = createDeck();
  const shuffledDeck = shuffleDeck(deck);
  const { players, board, remainingDeck } = dealCards(shuffledDeck);
  const [playerHand, bot1Hand, bot2Hand] = players;

  // Simplify to one AI version for now
  const aiConfig = { difficulty: 'beginner' };
  setupAI(aiConfig);

  initializeGame({
    playerHand,
    bot1Hand,
    bot2Hand,
    board,
    remainingDeck,
    aiConfig,
  });
});