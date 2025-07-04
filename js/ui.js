/* 
 * UI Rendering System for STACKED!
 * Handles all DOM manipulation and rendering
 * Works with any game mode
 */

class UISystem {
  constructor(gameEngine) {
    this.game = gameEngine;
    this.suitSymbols = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
    this.smartMessages = new SmartMessageSystem();
    this.draggableCombo = new DraggableModal('combination-area');
  }

  // Main render function
  render() {
    const state = this.game.getState();
    
    this.renderDeckCount();
    this.renderTable();
    this.renderComboArea();
    this.renderBoard();
    this.renderHands();
    this.renderBotHands();
    this.renderScores();
    this.renderDealerIndicator();
    this.updateSubmitButton();
    this.updateMessage();
    
    // Update smart messages
    const hasCardsInAreas = Object.values(state.combination).some(area => area.length > 0);
    if (hasCardsInAreas) {
      this.smartMessages.updateMessage('cards_in_areas');
    } else if (state.currentPlayer === 0) {
      this.smartMessages.updateMessage('turn_start');
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
        cardEl.addEventListener('touchstart', (e) => window.handleTouchStart(e, 'combo', { slot: slotName, comboIndex }));
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
    const visibleCards = bot1Cards.length;
    
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
    
    // 🎯 HYBRID SHRINKING: Compress gaps + shrink container
    const baseGap = 5;
    const reducedGap = Math.max(baseGap - (4 - visibleCards), 2);
    bot1HandEl.style.gap = `${reducedGap}px`;
    
    const cardWidth = 50;
    const handPadding = 20;
    const newWidth = (visibleCards * cardWidth) + ((visibleCards - 1) * reducedGap) + handPadding;
    bot1HandEl.style.width = `${Math.max(newWidth, 70)}px`;
  }

  if (bot2HandEl) {
    bot2HandEl.innerHTML = '';
    const bot2Cards = this.game.state.hands[2] || [];
    const visibleCards = bot2Cards.length;
    
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
    
    // 🎯 HYBRID SHRINKING: Compress gaps + shrink container
    const baseGap = 5;
    const reducedGap = Math.max(baseGap - (4 - visibleCards), 2);
    bot2HandEl.style.gap = `${reducedGap}px`;
    
    const cardWidth = 50;
    const handPadding = 20;
    const newWidth = (visibleCards * cardWidth) + ((visibleCards - 1) * reducedGap) + handPadding;
    bot2HandEl.style.width = `${Math.max(newWidth, 70)}px`;
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

  updateMessage() {
  const messageEl = document.getElementById('message');
  if (!messageEl) return;

  if (this.game.state.currentPlayer === 0) {
    // 🚨 CRITICAL FIX: Check if player is out of cards BUT DON'T TRIGGER BOTS
    if (this.game.state.hands[0].length === 0) {
      messageEl.textContent = "You're out of cards! Bots will finish the round.";
      this.smartMessages.showMessage("You're out of cards! Bots will finish the round.");
      // 🔥 REMOVED: The automatic bot scheduling that was causing the loop!
      return;
    } else if (this.game.state.combination.base.length === 0) {
      messageEl.textContent = "Drag or tap cards to the play areas to capture, or place a card on the board to end your turn.";
      this.smartMessages.updateMessage('turn_start');
    } else {
      messageEl.textContent = "Click 'Submit Move' to capture, or place a card to end your turn.";
      this.smartMessages.updateMessage('cards_in_areas');
    }
  } else {
    const botMessage = `Bot ${this.game.state.currentPlayer}'s turn...`;
    messageEl.textContent = botMessage;
    this.smartMessages.showMessage(botMessage);
  }
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