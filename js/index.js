// index.js - App Entry Point
import './debug.js';
import './captureLogic.js';
import './turnManager.js';
import './gameLogic.js';
import { initializeGame } from './main.js';
import { createDeck, shuffleDeck, dealCards } from './deck.js';
import { setupAI } from './ai.js';

console.log('%cSTACKED! Initialized', 'color: limegreen; font-weight: bold');

let gameState;

// Show settings modal immediately when page loads
function showSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const startGameBtn = document.getElementById('start-game-btn');
  const tutorialBtn = document.getElementById('tutorial-btn');
  
  if (modal) {
    modal.showModal();
    console.log('Settings modal opened');
    
    // Remove existing listeners by cloning
    const newStartBtn = startGameBtn.cloneNode(true);
    startGameBtn.parentNode.replaceChild(newStartBtn, startGameBtn);
    const newTutorialBtn = tutorialBtn.cloneNode(true);
    tutorialBtn.parentNode.replaceChild(newTutorialBtn, tutorialBtn);
    
    newStartBtn.addEventListener('click', () => {
      gameState.settings.cardSpeed = document.getElementById('card-speed').value;
      gameState.settings.soundEffects = document.getElementById('sound-effects').value;
      gameState.settings.targetScore = parseInt(document.getElementById('target-score').value);
      gameState.settings.botDifficulty = document.getElementById('bot-difficulty').value;
      modal.close();
      gameState.render();
    });
    
    newTutorialBtn.addEventListener('click', () => {
      alert('Match cards that sum to the same number! Take turns playing against bots. Highest score wins!');
      modal.close();
    });
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

  gameState = initializeGame({
    playerHand,
    bot1Hand,
    bot2Hand,
    board,
    remainingDeck,
    aiConfig,
  });
});