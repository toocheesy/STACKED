/* 
 * UI Rendering System for STACKED!
 * Handles all DOM manipulation and rendering
 * 🔥 FIXED: Centralized modal system with game pausing + WORKING DRAG/DROP
 */

class UISystem {
  constructor(gameEngine) {
    // 🔧 PRODUCTION DEBUG TOGGLE
    const DEBUG_CONFIG = {
      UI_RENDERING: false,     // Set to false for production
      ERRORS: true,
      SETUP: true,
    };

    function debugLog(category, ...args) {
      if (DEBUG_CONFIG[category]) {
        console.log(...args);
      }
    }

    function debugError(...args) {
      if (DEBUG_CONFIG.ERRORS) {
        console.error(...args);
      }
    }

    // Make debug functions available to the class
    this.debugLog = debugLog;
    this.debugError = debugError;
    this.game = gameEngine;
    this.suitSymbols = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
    this.draggableCombo = new DraggableModal('combination-area');
    
    // NEW - proper ModalManager integration
if (typeof ModalManager !== 'undefined') {
  this.modalManager = new ModalManager(this.game, this);
  this.modalManager.ensureModalStyling();
} else {
  console.error('❌ ModalManager class not available');
  this.modalManager = null;
}
  }

// 🎪 MODAL DISPLAY - Delegate to ModalManager
showModal(type, data = {}) {
    if (this.modalManager && typeof this.modalManager.show === 'function') {
      return this.modalManager.show(type, data);
    } else {
      console.error('❌ ModalManager not initialized properly');
      return false;
    }
  }

  // 🔥 COMPLETE render() method with renderBotCardCounts() call added
// 🔥 SAFE VERSION WITH PROPER ERROR CHECKING:
render() {
  // Reset render optimization for player turns
  if (this.game?.state?.currentPlayer === 0) {
    this.resetRenderFlags();
  }

  // 🔥 SAFE MODAL CHECK WITH FALLBACKS
  if (this.modalManager &&
      typeof this.modalManager.isActive === 'function' &&
      this.modalManager.isActive() &&
      this.modalManager.getCurrentModal &&
      this.modalManager.getCurrentModal() !== 'round_end') {
    return;
  }
  
  const state = this.game.getState();
  
  // Connect message controller if not already connected
  if (window.messageController && !window.messageController.gameEngine) {
    this.initMessageController();
  }
  
  this.renderDeckCount();
  this.renderTable();
  this.renderComboArea();
  this.renderBoard();
  this.renderHands();
  this.renderBotHands();
  this.renderScores();
  this.renderBotCardCounts();
  this.renderDealerIndicator();
  this.updateSubmitButton();
  
  // 🎯 ENHANCED: COMBO ASSISTANCE LOGIC
  const comboStatus = this.getComboAreaStatus();

  if (comboStatus.hasCards) {
    // 🎯 TRIGGER COMBO ANALYSIS FOR BEGINNERS (SAFE CHECK)
    if (window.messageController && window.messageController.educationalMode) {
      this.sendMessageEvent('COMBO_ANALYSIS', comboStatus);
    } else if (window.messageController) {
      this.sendMessageEvent('CARDS_IN_COMBO', comboStatus);
    }
  } else if (state.currentPlayer === 0) {
    this.sendMessageEvent('TURN_START');
  } else {
    this.sendMessageEvent('BOT_THINKING', { botNumber: state.currentPlayer });
  }
}

  renderDeckCount() {
    const deckCountEl = document.getElementById('deck-count');
    if (deckCountEl) {
      deckCountEl.textContent = `${this.game.state.deck.length || 0} left`;
    }
  }

  renderTable() {
    // Board is now a flex row in CSS — no transform centering needed
    // Overflow handled by overflow-x: auto on .board
  }

  // Reset render flags when player turn starts
resetRenderFlags() {
  this._comboAreaRendered = false;
  this._botHandsRendered = false;  // ADD THIS LINE
}

  // 🔧 SMART FIX - Work with your existing beautiful HTML
  renderComboArea() {
  // 🔧 PERFORMANCE FIX: Skip unnecessary re-renders
  if (this._comboAreaRendered && this.game?.state?.currentPlayer !== 0) {
    return;
  }

    // Try your actual HTML structure first
    let comboAreaEl = document.querySelector('.combo-area');

    // Fallback to old structure if needed
    if (!comboAreaEl) {
      comboAreaEl = document.getElementById('combination-area');
    }

    if (!comboAreaEl) {
      console.error('❌ Combo area element not found! Looking for .combo-area or #combination-area');
      return;
    }

    // Work with your actual HTML structure - individual IDs
    const baseEl = document.getElementById('base-area');
    const sum1El = document.getElementById('sum1-area');
    const sum2El = document.getElementById('sum2-area');
    const sum3El = document.getElementById('sum3-area');
    const matchEl = document.getElementById('match-area');

    if (!(baseEl && sum1El && sum2El && sum3El && matchEl)) {
      console.error('❌ One or more combo slots not found!');
      return;
    }

    // Render each area using your actual element structure
    this.renderArea(baseEl, this.game.state.combination.base, 'base', 'Base Card');
    this.renderArea(sum1El, this.game.state.combination.sum1, 'sum1', 'Sum Cards');
    this.renderArea(sum2El, this.game.state.combination.sum2, 'sum2', 'Sum Cards');
    this.renderArea(sum3El, this.game.state.combination.sum3, 'sum3', 'Sum Cards');
    this.renderArea(matchEl, this.game.state.combination.match, 'match', 'Matching Cards');

    // Validate combinations
    this.validateAndStyleComboArea(baseEl, sum1El, sum2El, sum3El, matchEl);
    
    // Mark as rendered to prevent unnecessary re-renders
    this._comboAreaRendered = true;
  }

  validateAndStyleComboArea(baseEl, sum1El, sum2El, sum3El, matchEl) {
    let validCaptures = [];
    let isAnyValid = false;

    if (this.game.state.combination.base.length === 1) {
      const baseCard = this.game.state.combination.base[0];
      const baseValue = parseInt(baseCard.card.value) || 1;

      // Validate each area using game engine
      const areas = [
        { el: sum1El, cards: this.game.state.combination.sum1, name: 'Sum Area 1' },
        { el: sum2El, cards: this.game.state.combination.sum2, name: 'Sum Area 2' },
        { el: sum3El, cards: this.game.state.combination.sum3, name: 'Sum Area 3' },
        { el: matchEl, cards: this.game.state.combination.match, name: 'Match Area' }
      ];

      areas.forEach(({ el, cards, name }) => {
        if (cards.length > 0) {
          const result = this.game.validateCapture(cards, baseValue, baseCard, name.toLowerCase());
          if (result.isValid) {
            validCaptures.push(`${name}: ${result.details}`);
            el.classList.add('valid-combo');
            isAnyValid = true;
          } else {
            el.classList.remove('valid-combo');
          }
        }
      });

      if (isAnyValid) {
        baseEl.classList.add('valid-combo');
      } else {
        baseEl.classList.remove('valid-combo');
      }
    } else {
      [baseEl, sum1El, sum2El, sum3El, matchEl].forEach(el => el.classList.remove('valid-combo'));
    }
  }

  // Rewritten renderArea — reads CSS variables for sizing
  renderArea(areaEl, cards, slotName, placeholderText) {
    // Clear content but preserve the element
    areaEl.innerHTML = '';

    // Read CSS variables for stacking offset and slot height
    const styles = getComputedStyle(document.documentElement);
    const stackOffset = parseFloat(styles.getPropertyValue('--slot-card-offset')) || 12;
    const slotH = parseFloat(styles.getPropertyValue('--slot-h')) || 52;
    const badgeTop = styles.getPropertyValue('--sum-badge-top').trim() || '-16px';
    const badgeFont = styles.getPropertyValue('--sum-badge-font').trim() || '10px';

    // Add live sum totals for sum areas
    if (slotName.startsWith('sum') && cards.length > 0) {
      const sumTotal = this.calculateSumTotal(cards);
      const sumDisplay = document.createElement('div');
      sumDisplay.className = 'sum-total-display';
      sumDisplay.textContent = `[${sumTotal}]`;

      areaEl.style.position = 'relative';
      areaEl.style.overflow = 'visible';

      sumDisplay.style.cssText = `
        position: absolute;
        top: ${badgeTop};
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #8B5A2B, #A0622F);
        color: #F5E8C7;
        padding: 2px 6px;
        border-radius: 6px;
        font-weight: bold;
        font-size: ${badgeFont};
        font-family: 'Cabin', sans-serif;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        border: 1px solid #D2A679;
        z-index: 1000;
        white-space: nowrap;
        pointer-events: none;
        min-width: 20px;
        text-align: center;
      `;

      areaEl.appendChild(sumDisplay);
    } else {
      if (slotName.startsWith('sum')) {
        areaEl.style.position = 'relative';
        areaEl.style.overflow = 'visible';
      }
    }

    // Add cards to the area
    if (cards.length > 0) {
      cards.forEach((comboEntry, comboIndex) => {
        const card = comboEntry.card;
        const cardEl = document.createElement('div');
        cardEl.className = `card ${card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : ''}`;
        cardEl.textContent = `${card.value}${this.suitSymbols[card.suit]}`;
        cardEl.style.position = 'absolute';
        cardEl.style.top = `${comboIndex * stackOffset}px`;
        cardEl.setAttribute('draggable', 'true');
        cardEl.setAttribute('data-slot', slotName);
        cardEl.setAttribute('data-combo-index', comboIndex);
        cardEl.addEventListener('dragstart', (e) => window.handleDragStartCombo(e, slotName, comboIndex));
        cardEl.addEventListener('dragend', window.handleDragEnd);
        cardEl.addEventListener('touchstart', (e) => window.handleTouchStart(e, 'combo', { slot: slotName, comboIndex }), { passive: false });
        cardEl.addEventListener('touchmove', (e) => window.handleTouchMove && window.handleTouchMove(e), { passive: false });
        cardEl.addEventListener('touchend', window.handleTouchEnd);
        areaEl.appendChild(cardEl);
      });
      areaEl.style.height = `${slotH + (cards.length - 1) * stackOffset}px`;
    } else {
      areaEl.style.backgroundColor = 'rgba(241, 196, 15, 0.1)';
      areaEl.style.border = '';
      areaEl.style.height = '';
    }
    
    // 🔥 CRITICAL FIX: Ensure drop events work by removing and re-adding listeners properly
    // Remove old event listeners using proper cleanup
    if (areaEl._boundDragOver) {
      areaEl.removeEventListener('dragover', areaEl._boundDragOver);
    }
    if (areaEl._boundDrop) {
      areaEl.removeEventListener('drop', areaEl._boundDrop);
    }
    if (areaEl._boundTouchEnd) {
      areaEl.removeEventListener('touchend', areaEl._boundTouchEnd);
    }
    
    // Create new bound functions
    areaEl._boundDragOver = (e) => {
      e.preventDefault();
    };

    areaEl._boundDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.handleDrop(e, slotName);
    };

    areaEl._boundTouchEnd = (e) => {
      e.preventDefault();
      window.handleTouchDrop(e, 'combo', slotName);
    };

    // Add fresh event listeners with passive options
areaEl.addEventListener('dragover', areaEl._boundDragOver, { passive: false });
areaEl.addEventListener('drop', areaEl._boundDrop, { passive: false });
areaEl.addEventListener('touchend', areaEl._boundTouchEnd, { passive: true });
    
    return areaEl;
  }

  // Calculate sum total for sum areas
  calculateSumTotal(cards) {
    return cards.reduce((total, comboEntry) => {
      const card = comboEntry.card;
      let value = 0;
      
      if (card.value === 'A') {
        value = 1; // Aces = 1 for sum calculations
      } else if (['J', 'Q', 'K'].includes(card.value)) {
        value = 10; // Face cards = 10
      } else {
        value = parseInt(card.value) || 0;
      }
      
      return total + value;
    }, 0);
  }

  // Add this method to your UISystem class in ui.js
renderBotCardCounts() {
  const bot1CardsEl = document.getElementById('bot1-cards');
  const bot2CardsEl = document.getElementById('bot2-cards');

  if (bot1CardsEl) {
    const bot1Count = this.game.state.hands[1] ? this.game.state.hands[1].length : 0;
    bot1CardsEl.textContent = `${bot1Count} cards`;
  }

  if (bot2CardsEl) {
    const bot2Count = this.game.state.hands[2] ? this.game.state.hands[2].length : 0;
    bot2CardsEl.textContent = `${bot2Count} cards`;
  }
}

// Then add this call to your main render() method
// Find the render() method and add this line after renderScores():
// this.renderBotCardCounts();

  renderBoard() {
    const boardEl = document.getElementById('board');
    if (!boardEl) return;

    boardEl.innerHTML = '';
    
    if (this.game.state.board && Array.isArray(this.game.state.board)) {
      this.game.state.board.forEach((card, index) => {
        if (this.isCardInPlayArea(index, 'board')) return;

        const cardEl = this.createCardElement(card, index, 'board');
        boardEl.appendChild(cardEl);
      });
    }

    boardEl.addEventListener('dragover', (e) => e.preventDefault());
    boardEl.addEventListener('drop', window.handleBoardDrop);
    boardEl.addEventListener('touchend', (e) => window.handleTouchDrop(e, 'board'));
  }

  renderHands() {
    const handEl = document.getElementById('player-hand');
    if (!handEl) return;

    handEl.innerHTML = '';
    
    for (let index = 0; index < 4; index++) {
      const card = this.game.state.hands[0] && this.game.state.hands[0][index] ? this.game.state.hands[0][index] : null;
      const cardEl = document.createElement('div');
      
      const isInPlayArea = this.isCardInPlayArea(index, 'hand', 0);
      if (isInPlayArea || !card) {
        this.createEmptyCardSlot(cardEl, index, 'hand');
      } else {
        this.setupCardElement(cardEl, card, index, 'hand');
      }
      
      handEl.appendChild(cardEl);
    }
  }

  renderBotHands() {
  // Skip if already rendered and no changes
  if (this._botHandsRendered && this.game?.state?.currentPlayer !== 0) {
    return;
  }
    const bot1HandEl = document.getElementById('bot1-hand');
    const bot2HandEl = document.getElementById('bot2-hand');
    
    if (bot1HandEl) {
      bot1HandEl.innerHTML = '';
      const bot1Cards = this.game.state.hands[1] || [];
      
      // Create 4 fixed card slots
      for (let i = 0; i < 4; i++) {
        const cardEl = document.createElement('div');
        
        if (i < bot1Cards.length) {
          // Show actual card
          cardEl.className = 'card back';
          cardEl.style.visibility = 'visible';
        } else {
          // Empty slot - invisible but takes up space
          cardEl.className = 'card back';
          cardEl.style.visibility = 'hidden';
        }
        
        bot1HandEl.appendChild(cardEl);
      }
    }

    if (bot2HandEl) {
      bot2HandEl.innerHTML = '';
      const bot2Cards = this.game.state.hands[2] || [];
      
      // Create 4 fixed card slots
      for (let i = 0; i < 4; i++) {
        const cardEl = document.createElement('div');
        
        if (i < bot2Cards.length) {
          // Show actual card
          cardEl.className = 'card back';
          cardEl.style.visibility = 'visible';
        } else {
          // Empty slot - invisible but takes up space
          cardEl.className = 'card back';
          cardEl.style.visibility = 'hidden';
        }
        
        bot2HandEl.appendChild(cardEl);
      }
    }
    
    // At the end, add:
    this._botHandsRendered = true;
  }

  renderScores() {
  const scores = this.game.state.scores;

  // Update individual score elements
  const playerScoreEl = document.getElementById('player-score');
  const bot1ScoreEl = document.getElementById('bot1-score');
  const bot2ScoreEl = document.getElementById('bot2-score');
  const bot1NameEl = document.getElementById('bot1-name');
  const bot2NameEl = document.getElementById('bot2-name');

  if (playerScoreEl) playerScoreEl.textContent = `${scores.player} pts`;
  if (bot1ScoreEl) bot1ScoreEl.textContent = `${scores.bot1} pts`;
  if (bot2ScoreEl) bot2ScoreEl.textContent = `${scores.bot2} pts`;

  // Update bot names from personality
  if (bot1NameEl && window.messageController) {
    bot1NameEl.textContent = window.messageController.getBotDisplayName(1);
  }
  if (bot2NameEl && window.messageController) {
    bot2NameEl.textContent = window.messageController.getBotDisplayName(2);
  }

  // Update target score display
  const targetScoreEl = document.getElementById('target-score');
  if (targetScoreEl) {
    const target = this.game.state.settings.targetScore || 300;
    targetScoreEl.textContent = `${target} pts`;
  }
}

  // 🔥 REPLACE renderDealerIndicator() FUNCTION in ui.js:
renderDealerIndicator() {
  const state = this.game.getState();
  const deckCount = state.deck ? state.deck.length : 0;
  const currentDealer = state.currentDealer !== undefined ? state.currentDealer : 0;
  
  // Remove existing dealer classes from all stat blocks
  const allIndicators = document.querySelectorAll('.sb-row');
  allIndicators.forEach(el => {
    el.classList.remove('dealer');
    el.removeAttribute('data-deck');
  });

  // Add dealer class to appropriate element based on current dealer
  let dealerElement = null;

  if (currentDealer === 0) {
    dealerElement = document.querySelector('.player-stat');
  } else if (currentDealer === 1) {
    dealerElement = document.querySelector('.bot1-indicator');
  } else if (currentDealer === 2) {
    dealerElement = document.querySelector('.bot2-indicator');
  }
  
  if (dealerElement) {
    dealerElement.classList.add('dealer');
    dealerElement.setAttribute('data-deck', deckCount);
  }
}

  updateSubmitButton() {
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      const hasBaseCard = this.game.state.combination.base.length === 1;
      const hasAnyCaptureCards = this.game.state.combination.sum1.length > 0 || 
                               this.game.state.combination.sum2.length > 0 || 
                               this.game.state.combination.sum3.length > 0 || 
                               this.game.state.combination.match.length > 0;
      
      submitBtn.disabled = !(this.game.state.currentPlayer === 0 && hasBaseCard && hasAnyCaptureCards);
    }
  }

  // Message controller integration
  updateMessage() {
    // Message controller handles everything now
    if (window.messageController) {
      window.messageController.forceRefresh();
    }
  }

  initMessageController() {
    if (window.messageController && this.game) {
      window.messageController.connect(this.game);
    }
  }

  sendMessageEvent(eventType, data = {}) {
    if (window.messageController && typeof window.messageController.handleGameEvent === 'function') {
      window.messageController.handleGameEvent(eventType, data);
    }
  }

  getComboAreaStatus() {
    const combo = this.game.state.combination;
    const totalCards = combo.base.length + combo.sum1.length + combo.sum2.length + combo.sum3.length + combo.match.length;
    
    return {
      hasCards: totalCards > 0,
      cardCount: totalCards,
      hasBase: combo.base.length > 0,
      baseCard: combo.base.length > 0 ? combo.base[0].card : null,
      sumCards: combo.sum1.length + combo.sum2.length + combo.sum3.length,
      matchCards: combo.match.length,
      comboData: {
        base: combo.base,
        sum1: combo.sum1,
        sum2: combo.sum2,
        sum3: combo.sum3,
        match: combo.match
      }
    };
  }

  renderBotComboCard(card, targetSlot, isFromBot = true) {
  const areaEl = document.getElementById(`${targetSlot}-area`);
  if (!areaEl) return;
  
  // Create visible bot card
  const cardEl = document.createElement('div');
  cardEl.className = `card bot-combo-card ${card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : ''}`;
  cardEl.textContent = `${card.value}${this.suitSymbols[card.suit]}`;
  
  // Style for bot cards
  cardEl.style.cssText = `
    border: 3px solid #FFD700 !important;
    background: linear-gradient(135deg, #FFF8DC, #F0E68C) !important;
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.6) !important;
    font-weight: bold !important;
    position: relative !important;
    transform: scale(1.05) !important;
    z-index: 100 !important;
  `;
  
  // Add bot name indicator (use personality name if available)
  const botIndicator = document.createElement('div');
  const currentBot = this.game.state.currentPlayer;
  const botName = (window.messageController && currentBot > 0)
    ? window.messageController.getBotDisplayName(currentBot)
    : 'BOT';
  botIndicator.textContent = botName;
  botIndicator.style.cssText = `
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: #FF6B6B;
    color: white;
    font-size: 7px;
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: bold;
    z-index: 101;
    white-space: nowrap;
    pointer-events: none;
  `;
  
  cardEl.appendChild(botIndicator);
  areaEl.appendChild(cardEl);
  
  return cardEl;
}

  highlightBotComboArea(targetSlot) {
  const areaEl = document.getElementById(`${targetSlot}-area`);
  if (areaEl) {
    areaEl.style.border = '3px solid #FFD700'; // Gold border for bot combo
    areaEl.style.backgroundColor = 'rgba(255, 215, 0, 0.1)'; // Light gold background
    
    // Remove highlight after a delay
    setTimeout(() => {
      areaEl.style.border = '';
      areaEl.style.backgroundColor = '';
    }, 1500);
  }
}

cleanupBotComboVisuals() {
  // Remove all bot combo cards
  const botCards = document.querySelectorAll('.bot-combo-card');
  botCards.forEach(card => card.remove());
  
  // Clear any lingering highlights
  const areas = ['base', 'sum1', 'sum2', 'sum3', 'match'];
  areas.forEach(area => {
    const areaEl = document.getElementById(`${area}-area`);
    if (areaEl) {
      areaEl.style.border = '';
      areaEl.style.backgroundColor = '';
    }
  });
}

  // Helper methods
  isCardInPlayArea(index, source, playerIndex = null) {
  // Only hide hand cards for the current player during their own turn
  if (source === 'hand' && this.game.state.currentPlayer !== 0) {
    return false; // Never hide hand cards during bot turns
  }
  
  // Check if this specific card is in any combo area
  return Object.values(this.game.state.combination).some(area => 
    area.some(entry => 
      entry.source === source && 
      entry.index === index &&
      // For hand cards, only hide if current player put them there
      (source !== 'hand' || entry.playerSource === 0) // Only hide for human player
    )
  );
}

  createCardElement(card, index, type) {
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : ''}`;
    cardEl.textContent = `${card.value}${this.suitSymbols[card.suit]}`;
    cardEl.setAttribute('draggable', 'true');
    cardEl.setAttribute('data-index', index);
    cardEl.setAttribute('data-type', type);
    cardEl.addEventListener('dragstart', (e) => {
  window.handleDragStart(e, type, index);
});
    cardEl.addEventListener('dragend', window.handleDragEnd);
    cardEl.addEventListener('dragover', (e) => e.preventDefault());
    cardEl.addEventListener('drop', (e) => window.handleDropOriginal(e, type, index));
    cardEl.addEventListener('touchstart', (e) => window.handleTouchStart(e, type, index), { passive: false });
    cardEl.addEventListener('touchmove', (e) => window.handleTouchMove && window.handleTouchMove(e), { passive: false });
    cardEl.addEventListener('touchend', window.handleTouchEnd);
    return cardEl;
  }

  createEmptyCardSlot(cardEl, index, type) {
    cardEl.className = 'card';
    cardEl.style.backgroundColor = '#f0f0f0';
    cardEl.style.border = '2px dashed #ccc';
    cardEl.textContent = '';
    cardEl.setAttribute('data-index', index);
    cardEl.setAttribute('data-type', type);
    cardEl.addEventListener('dragover', (e) => e.preventDefault());
    cardEl.addEventListener('drop', (e) => window.handleDropOriginal(e, type, index));
    cardEl.addEventListener('touchend', (e) => window.handleTouchDrop(e, type, index));
  }

  setupCardElement(cardEl, card, index, type) {
    cardEl.className = `card ${card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : ''}`;
    cardEl.textContent = `${card.value}${this.suitSymbols[card.suit]}`;
    cardEl.setAttribute('draggable', 'true');
    cardEl.setAttribute('data-index', index);
    cardEl.setAttribute('data-type', type);
    cardEl.addEventListener('dragstart', (e) => window.handleDragStart(e, type, index));
    cardEl.addEventListener('dragend', window.handleDragEnd);
    cardEl.addEventListener('dragover', (e) => e.preventDefault());
    cardEl.addEventListener('drop', (e) => window.handleDropOriginal(e, type, index));
    cardEl.addEventListener('touchstart', (e) => window.handleTouchStart(e, type, index), { passive: false });
    cardEl.addEventListener('touchmove', (e) => window.handleTouchMove && window.handleTouchMove(e), { passive: false });
    cardEl.addEventListener('touchend', window.handleTouchEnd, { passive: false });
  }
}

// Export for use in other files
window.UISystem = UISystem;