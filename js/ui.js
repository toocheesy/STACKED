/* 
 * UI Rendering System for STACKED!
 * Handles all DOM manipulation and rendering
 * 🔥 FIXED: Centralized modal system with game pausing + WORKING DRAG/DROP
 */

class UISystem {
  constructor(gameEngine) {
    this.game = gameEngine;
    this.suitSymbols = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
    this.draggableCombo = new DraggableModal('combination-area');
    
    // NEW - proper ModalManager integration
if (typeof ModalManager !== 'undefined') {
  this.modalManager = new ModalManager(this.game, this);
  this.modalManager.ensureModalStyling();
  console.log('✅ ModalManager initialized in UI constructor');
} else {
  console.error('❌ ModalManager class not available');
  this.modalManager = null;
}
  }

// 🎪 MODAL DISPLAY - Delegate to ModalManager
showModal(type, data = {}) {
    console.log(`🎪 UI: Showing modal: ${type}`);
    
    if (this.modalManager && typeof this.modalManager.show === 'function') {
      return this.modalManager.show(type, data);
    } else {
      console.error('❌ ModalManager not initialized properly');
      return false;
    }
  }

  // 🎯 ENHANCED render() FUNCTION - WITH COMBO ASSISTANCE TRIGGERS
  render() {
    // 🔥 NEW: Don't render if modal is active
    if (this.modalManager && this.modalManager.isModalActive()) {
      console.log('🎪 SKIPPING RENDER: Modal is active');
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
    this.renderDealerIndicator();
    this.updateSubmitButton();
    
    // 🎓 ENHANCED: COMBO ASSISTANCE LOGIC
    const comboStatus = this.getComboAreaStatus();

    if (comboStatus.hasCards) {
      // 🎓 TRIGGER COMBO ANALYSIS FOR BEGINNERS (SAFE CHECK)
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
      deckCountEl.textContent = `Deck: ${this.game.state.deck.length || 0} cards`;
    }
  }

  renderTable() {
    const tableEl = document.querySelector('.table');
    if (!tableEl) return;

    const cardCount = this.game.state.board ? this.game.state.board.length : 0;
    
    // Keep table size consistent
    tableEl.style.width = '800px';
    tableEl.style.maxWidth = '800px';
    tableEl.style.height = 'auto';
    
    // Board positioning
    const boardEl = document.getElementById('board');
    if (boardEl && cardCount > 8) {
      const rows = Math.ceil(cardCount / 4);
      const extraRows = rows - 2;
      const upwardShift = extraRows * 60;
      boardEl.style.transform = `translate(-50%, calc(-50% - ${upwardShift}px))`;
    } else if (boardEl) {
      boardEl.style.transform = 'translate(-50%, -50%)';
    }
    
    // Force fixed bot hand positions
    this.fixBotHandPositions();
  }

  fixBotHandPositions() {
    const bot1Hand = document.getElementById('bot1-hand');
    const bot2Hand = document.getElementById('bot2-hand');
    
    if (bot1Hand) {
      bot1Hand.style.setProperty('position', 'absolute', 'important');
      bot1Hand.style.setProperty('top', '50%', 'important');
      bot1Hand.style.setProperty('left', '-20px', 'important');
      bot1Hand.style.setProperty('transform', 'translateY(-50%) rotate(90deg)', 'important');
      bot1Hand.style.setProperty('transform-origin', 'center', 'important');
    }
    
    if (bot2Hand) {
      bot2Hand.style.setProperty('position', 'absolute', 'important');
      bot2Hand.style.setProperty('top', '50%', 'important');
      bot2Hand.style.setProperty('right', '-20px', 'important');
      bot2Hand.style.setProperty('transform', 'translateY(-50%) rotate(-90deg)', 'important');
      bot2Hand.style.setProperty('transform-origin', 'center', 'important');
    }
  }

  // 🔥 COMPLETELY FIXED COMBO AREA RENDERING
  renderComboArea() {
    const comboAreaEl = document.getElementById('combination-area');
    
    if (!comboAreaEl) {
      console.error('❌ Combo area element not found!');
      return;
    }

    const baseEl = comboAreaEl.querySelector('[data-slot="base"]');
    const sum1El = comboAreaEl.querySelector('[data-slot="sum1"]');
    const sum2El = comboAreaEl.querySelector('[data-slot="sum2"]');
    const sum3El = comboAreaEl.querySelector('[data-slot="sum3"]');
    const matchEl = comboAreaEl.querySelector('[data-slot="match"]');
    
    if (!(baseEl && sum1El && sum2El && sum3El && matchEl)) {
      console.error('❌ One or more combo slots not found!');
      return;
    }

    // Render each area (no cloning, just clean event management)
    this.renderArea(baseEl, this.game.state.combination.base, 'base', 'Base Card');
    this.renderArea(sum1El, this.game.state.combination.sum1, 'sum1', 'Sum Cards');
    this.renderArea(sum2El, this.game.state.combination.sum2, 'sum2', 'Sum Cards');
    this.renderArea(sum3El, this.game.state.combination.sum3, 'sum3', 'Sum Cards');
    this.renderArea(matchEl, this.game.state.combination.match, 'match', 'Matching Cards');

    // Validate combinations
    this.validateAndStyleComboArea(baseEl, sum1El, sum2El, sum3El, matchEl);
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

  // 🔥 COMPLETELY REWRITTEN RENDERAREA - NO MORE DOM CLONING ISSUES
  renderArea(areaEl, cards, slotName, placeholderText) {
    // Clear content but preserve the element
    areaEl.innerHTML = '';
    
    // Add live sum totals for sum areas
    if (slotName.startsWith('sum') && cards.length > 0) {
      const sumTotal = this.calculateSumTotal(cards);
      const sumDisplay = document.createElement('div');
      sumDisplay.className = 'sum-total-display';
      sumDisplay.textContent = `[${sumTotal}]`;
      
      areaEl.style.position = 'relative';
      areaEl.style.overflow = 'visible';
      
      sumDisplay.style.cssText = `
        position: absolute !important;
        top: -30px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        background: linear-gradient(135deg, #8B5A2B, #A0622F) !important;
        color: #F5E8C7 !important;
        padding: 3px 8px !important;
        border-radius: 6px !important;
        font-weight: bold !important;
        font-size: 13px !important;
        font-family: 'Cabin', sans-serif !important;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4) !important;
        border: 1px solid #D2A679 !important;
        z-index: 1000 !important;
        white-space: nowrap !important;
        pointer-events: none !important;
        min-width: 24px !important;
        text-align: center !important;
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
        cardEl.style.top = `${comboIndex * 20}px`;
        cardEl.setAttribute('draggable', 'true');
        cardEl.setAttribute('data-slot', slotName);
        cardEl.setAttribute('data-combo-index', comboIndex);
        cardEl.addEventListener('dragstart', (e) => window.handleDragStartCombo(e, slotName, comboIndex));
        cardEl.addEventListener('dragend', window.handleDragEnd);
        cardEl.addEventListener('touchstart', (e) => window.handleTouchStart(e, 'combo', { slot: slotName, comboIndex }));
        cardEl.addEventListener('touchend', window.handleTouchEnd);
        areaEl.appendChild(cardEl);
      });
      areaEl.style.height = `${110 + (cards.length - 1) * 20}px`;
    } else {
      areaEl.style.backgroundColor = 'rgba(241, 196, 15, 0.1)';
      areaEl.style.border = '2px dashed #ccc';
      areaEl.style.height = '110px';
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
      console.log(`🎯 DRAGOVER: ${slotName}`);
    };
    
    areaEl._boundDrop = (e) => {
      console.log(`🔥 DROP EVENT FIRED ON: ${slotName}`);
      e.preventDefault();
      e.stopPropagation();
      window.handleDrop(e, slotName);
    };
    
    areaEl._boundTouchEnd = (e) => {
      console.log(`🎯 TOUCH DROP ON: ${slotName}`);
      e.preventDefault();
      window.handleTouchDrop(e, 'combo', slotName);
    };
    
    // Add fresh event listeners
    areaEl.addEventListener('dragover', areaEl._boundDragOver);
    areaEl.addEventListener('drop', areaEl._boundDrop);
    areaEl.addEventListener('touchend', areaEl._boundTouchEnd);
    
    console.log(`✅ AREA EVENTS BOUND: ${slotName} - dragover, drop, touchend`);
    
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
        if (isInPlayArea) {
          console.log(`🔍 UI DEBUG: Hiding player card at position ${index} - found in combo area`);
        }
        this.createEmptyCardSlot(cardEl, index, 'hand');
      } else {
        this.setupCardElement(cardEl, card, index, 'hand');
      }
      
      handEl.appendChild(cardEl);
    }
  }

  renderBotHands() {
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
  }

  renderScores() {
    const playerScoreEl = document.getElementById('player-score');
    const bot1ScoreEl = document.getElementById('bot1-score');
    const bot2ScoreEl = document.getElementById('bot2-score');
    
    if (playerScoreEl) playerScoreEl.textContent = `Player: ${this.game.state.scores.player} pts`;
    if (bot1ScoreEl) bot1ScoreEl.textContent = `Bot 1: ${this.game.state.scores.bot1} pts`;
    if (bot2ScoreEl) bot2ScoreEl.textContent = `Bot 2: ${this.game.state.scores.bot2} pts`;
  }

  renderDealerIndicator() {
  // Get current state safely
  const state = this.game.getState();
  const deckCount = state.deck ? state.deck.length : 0;
  const currentDealer = state.currentDealer || 0; // Default to player if undefined
  
  // Remove existing dealer class from all possible elements
  const allIndicators = document.querySelectorAll('.bot-indicator, .scores');
  allIndicators.forEach(el => {
    el.classList.remove('dealer');
    el.removeAttribute('data-deck'); // Clean up old data
  });
  
  // Determine the target element based on dealer
  let dealerElement = null;
  if (currentDealer === 0) { // Player (assuming index 0 is human)
    dealerElement = document.querySelector('.scores');
  } else if (currentDealer === 1) { // Bot1
    dealerElement = document.querySelector('.bot1-indicator');
  } else if (currentDealer === 2) { // Bot2
    dealerElement = document.querySelector('.bot2-indicator');
  }
  
  // Add class and data if element exists
  if (dealerElement) {
    dealerElement.classList.add('dealer');
    dealerElement.setAttribute('data-deck', deckCount);
    console.log(`✅ Dealer indicator set for player ${currentDealer} with deck ${deckCount}`);
  } else {
    console.warn(`⚠️ No dealer element found for player ${currentDealer}`);
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
      console.log('🎯 UI: Message Controller connected!');
    }
  }

  sendMessageEvent(eventType, data = {}) {
    if (window.messageController && typeof window.messageController.handleGameEvent === 'function') {
      window.messageController.handleGameEvent(eventType, data);
    } else {
      console.log(`🎯 MESSAGE EVENT: ${eventType}`, data);
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

  // Helper methods
  isCardInPlayArea(index, source, playerIndex = null) {
  // Check if this specific card is in any combo area
  return Object.values(this.game.state.combination).some(area => 
    area.some(entry => 
      entry.source === source && 
      entry.index === index &&
      // For hand cards, only hide if current player put them there
      (source !== 'hand' || entry.playerSource === this.game.state.currentPlayer)
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
  console.log('🎯 DRAG START: From type=', type, 'index=', index, 'card=', e.target.textContent);
  window.handleDragStart(e, type, index);
});
    cardEl.addEventListener('dragend', window.handleDragEnd);
    cardEl.addEventListener('dragover', (e) => e.preventDefault());
    cardEl.addEventListener('drop', (e) => window.handleDropOriginal(e, type, index));
    cardEl.addEventListener('touchstart', (e) => window.handleTouchStart(e, type, index));
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
    cardEl.addEventListener('touchstart', (e) => window.handleTouchStart(e, type, index));
    cardEl.addEventListener('touchend', window.handleTouchEnd);
  }
}

// Export for use in other files
window.UISystem = UISystem;