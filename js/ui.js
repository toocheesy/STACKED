/* 
 * Draggable Modal Class - Simple Version
 */
class DraggableModal {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    this.isDragging = false;
    this.currentX = 0;
    this.currentY = 0;
    this.initialX = 0;
    this.initialY = 0;
    this.xOffset = 0;
    this.yOffset = 0;
    
    if (this.element) {
      // Make the modal title draggable
      const title = this.element.querySelector('.modal-title');
      if (title) {
        title.style.cursor = 'move';
        title.addEventListener('mousedown', this.dragStart.bind(this));
      }
      
      document.addEventListener('mousemove', this.dragMove.bind(this));
      document.addEventListener('mouseup', this.dragEnd.bind(this));
    }
  }
  
  dragStart(e) {
    // Don't drag if clicking on buttons or combo areas
    if (e.target.classList.contains('modal-btn') || 
        e.target.classList.contains('combo-slot') ||
        e.target.classList.contains('card')) {
      return;
    }
    
    this.initialX = e.clientX - this.xOffset;
    this.initialY = e.clientY - this.yOffset;
    this.isDragging = true;
  }
  
  dragMove(e) {
    if (!this.isDragging) return;
    
    e.preventDefault();
    this.currentX = e.clientX - this.initialX;
    this.currentY = e.clientY - this.initialY;
    this.xOffset = this.currentX;
    this.yOffset = this.currentY;
    
    this.element.style.transform = `translate(${this.currentX}px, ${this.currentY}px)`;
  }
  
  dragEnd() {
    this.isDragging = false;
  }
}

/* 
 * UI Rendering System for STACKED!
 * Handles all DOM manipulation and rendering
 * Works with any game mode
 * 🔥 FIXED: educationalMode check (TICKET #2)
 * 🔥 FIXED: Undefined 'length' error in validateAndStyleComboArea (TICKET #3)
 * 🔥 FIXED: Non-passive touchstart event listener warning
 * 🎯 ENHANCED: Hint System Support Added (TICKET #11)
 */
class UISystem {
  constructor(gameEngine) {
    this.game = gameEngine;
    this.suitSymbols = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
    this.draggableCombo = new DraggableModal('combination-area');
    this.initHintStyles();
  }

  // 🎯 INITIALIZE HINT SYSTEM STYLES
  initHintStyles() {
    // Add hint CSS styles if not already present
    if (!document.getElementById('hint-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'hint-styles';
      styleSheet.textContent = `
        /* 🎯 HINT SYSTEM STYLES */
        .hint-popup {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, #8B4513, #A0522D);
          border: 3px solid #D2691E;
          border-radius: 15px;
          padding: 20px;
          z-index: 10000;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
          font-family: 'Georgia', serif;
          max-width: 400px;
          opacity: 0;
          transition: all 0.3s ease;
        }
        
        .hint-popup.show {
          opacity: 1;
        }
        
        .hint-content {
          color: #F5DEB3;
          text-align: center;
        }
        
        .hint-header {
          font-size: 1.4em;
          font-weight: bold;
          color: #FFD700;
          margin-bottom: 15px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        
        .hint-suggestion {
          font-size: 1.1em;
          line-height: 1.4;
          margin-bottom: 20px;
        }
        
        .hint-suggestion strong {
          color: #FFD700;
        }
        
        .highlight-card {
          background: rgba(255, 215, 0, 0.3);
          padding: 2px 5px;
          border-radius: 4px;
          font-weight: bold;
          color: #FFD700;
        }
        
        .hint-close {
          background: linear-gradient(135deg, #228B22, #32CD32);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          font-size: 1em;
          transition: transform 0.2s ease;
        }
        
        .hint-close:hover {
          transform: translateY(-2px);
          background: linear-gradient(135deg, #32CD32, #228B22);
        }
        
        /* 🎯 HINT GLOW EFFECTS */
        .hint-glow {
          animation: hintPulse 2s infinite;
          box-shadow: 0 0 20px #FFD700, 0 0 40px #FFD700, 0 0 60px #FFD700;
          border: 2px solid #FFD700 !important;
        }
        
        .hint-hand-card {
          background: linear-gradient(135deg, #FFD700, #FFA500) !important;
          color: #8B4513 !important;
          font-weight: bold;
        }
        
        .hint-target-card {
          background: linear-gradient(135deg, #32CD32, #228B22) !important;
          color: white !important;
          font-weight: bold;
        }
        
        @keyframes hintPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `;
      document.head.appendChild(styleSheet);
    }
  }

  // 🎯 ENHANCED render() FUNCTION - WITH COMBO ASSISTANCE TRIGGERS
  render() {
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
      // 🎓 TRIGGER COMBO ANALYSIS FOR BEGINNERS WITH SAFETY CHECK
      if (window.messageController && window.messageController.educationalMode) {
        this.sendMessageEvent('COMBO_ANALYSIS', comboStatus);
      } else {
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

  renderComboArea() {
    const comboAreaEl = document.getElementById('combination-area');
    let captureTypeMessage = "No cards in play areas.";
    
    if (!comboAreaEl) return;

    const baseEl = comboAreaEl.querySelector('[data-slot="base"]');
    const sum1El = comboAreaEl.querySelector('[data-slot="sum1"]');
    const sum2El = comboAreaEl.querySelector('[data-slot="sum2"]');
    const sum3El = comboAreaEl.querySelector('[data-slot="sum3"]');
    const matchEl = comboAreaEl.querySelector('[data-slot="match"]');
    
    if (!(baseEl && sum1El && sum2El && sum3El && matchEl)) return;

    // Render each area
    this.renderArea(baseEl, this.game.state.combination.base, 'base', 'Base Card');
    this.renderArea(sum1El, this.game.state.combination.sum1, 'sum1', 'Sum Cards');
    this.renderArea(sum2El, this.game.state.combination.sum2, 'sum2', 'Sum Cards');
    this.renderArea(sum3El, this.game.state.combination.sum3, 'sum3', 'Sum Cards');
    this.renderArea(matchEl, this.game.state.combination.match, 'match', 'Matching Cards');

    // Validate combinations
    this.validateAndStyleComboArea(baseEl, sum1El, sum2El, sum3El, matchEl);

    // Add event listeners
    const areas = [
      { el: baseEl, slot: 'base' },
      { el: sum1El, slot: 'sum1' },
      { el: sum2El, slot: 'sum2' },
      { el: sum3El, slot: 'sum3' },
      { el: matchEl, slot: 'match' }
    ];

    areas.forEach(({ el, slot }) => {
      el.addEventListener('dragover', (e) => e.preventDefault());
      el.addEventListener('drop', (e) => window.handleDrop(e, slot));
      el.addEventListener('touchend', (e) => window.handleTouchDrop(e, 'combo', slot));
    });
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

  renderArea(areaEl, cards, slotName, placeholderText) {
    areaEl.innerHTML = '';
    
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
        cardEl.addEventListener('touchstart', (e) => window.handleTouchStart(e, 'combo', { slot: slotName, comboIndex }), { passive: true });
        cardEl.addEventListener('touchend', window.handleTouchEnd);
        areaEl.appendChild(cardEl);
      });
      areaEl.style.height = `${110 + (cards.length - 1) * 20}px`;
    } else {
      areaEl.style.backgroundColor = 'rgba(241, 196, 15, 0.1)';
      areaEl.style.border = '2px dashed #ccc';
      areaEl.style.height = '110px';
      areaEl.textContent = placeholderText;
    }
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
      
      if (this.isCardInPlayArea(index, 'hand') || !card) {
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
    // Remove existing dealer indicators
    const existingDealer = document.querySelector('.dealer-indicator');
    if (existingDealer) existingDealer.remove();

    // Create new dealer indicator
    const dealerEl = document.createElement('div');
    dealerEl.className = 'dealer-indicator';
    
    const dealerNames = ['Player', 'Bot 1', 'Bot 2'];
    const deckCount = this.game.state.deck ? this.game.state.deck.length : 0;
    dealerEl.textContent = `${dealerNames[this.game.currentDealer]} Deals • Deck: ${deckCount}`;
    
    // Position based on current dealer
    if (this.game.currentDealer === 0) {
      dealerEl.classList.add('player-dealer');
    } else if (this.game.currentDealer === 1) {
      dealerEl.classList.add('bot1-dealer');
    } else {
      dealerEl.classList.add('bot2-dealer');
    }
    
    document.querySelector('.table')?.appendChild(dealerEl);
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

  // 🎯 UPDATED updateMessage() - NOW USES MESSAGE CONTROLLER
  updateMessage() {
    // 🔥 MESSAGE CONTROLLER HANDLES EVERYTHING NOW!
    // The MessageController will handle all message updates through events
    
    // Only keep this for backwards compatibility - but it should rarely be called
    if (window.messageController) {
      window.messageController.forceRefresh();
    }
  }

  // 🎯 INTEGRATE WITH MESSAGE CONTROLLER
  initMessageController() {
    if (window.messageController && this.game) {
      window.messageController.connect(this.game);
      console.log('🎯 UI: Message Controller connected!');
    }
  }

  // 🎯 SEND MESSAGE EVENTS TO CONTROLLER
  sendMessageEvent(eventType, data = {}) {
    if (window.messageController) {
      window.messageController.handleGameEvent(eventType, data);
    }
  }

  // 🎓 NEW: ENHANCED COMBO AREA STATUS WITH DETAILED INFO
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
  isCardInPlayArea(index, source) {
    return Object.values(this.game.state.combination).some(area => 
      area.some(entry => entry.source === source && entry.index === index)
    );
  }

  createCardElement(card, index, type) {
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : ''}`;
    cardEl.textContent = `${card.value}${this.suitSymbols[card.suit]}`;
    cardEl.setAttribute('draggable', 'true');
    cardEl.setAttribute('data-index', index);
    cardEl.setAttribute('data-type', type);
    cardEl.addEventListener('dragstart', (e) => window.handleDragStart(e, type, index));
    cardEl.addEventListener('dragend', window.handleDragEnd);
    cardEl.addEventListener('dragover', (e) => e.preventDefault());
    cardEl.addEventListener('drop', (e) => window.handleDropOriginal(e, type, index));
    cardEl.addEventListener('touchstart', (e) => window.handleTouchStart(e, type, index), { passive: true });
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
    cardEl.addEventListener('touchstart', (e) => window.handleTouchStart(e, type, index), { passive: true });
    cardEl.addEventListener('touchend', window.handleTouchEnd);
  }
}

// Export for use in other files
window.UISystem = UISystem;