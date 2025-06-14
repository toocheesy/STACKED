// index.js - App Entry Point
import './debug.js';
import './captureLogic.js';
import './turnManager.js';
import './gameLogic.js';
import { initializeGame } from './main.js';
import { createDeck, shuffleDeck, dealCards } from './deck.js';
import { setupAI } from './ai.js';

console.log('%cSTACKED! Initialized', 'color: limegreen; font-weight: bold');

// Show settings modal immediately when page loads
function showSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.showModal();
    console.log('Settings modal opened');
  } else {
    console.error('Settings modal not found');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Show settings first
  setTimeout(showSettingsModal, 100); // Small delay to ensure DOM is ready
  
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