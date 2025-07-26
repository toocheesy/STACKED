/* 
 * UI Rendering System for STACKED!
 * Handles all DOM manipulation and rendering
 * 🔥 FIXED: Centralized modal system with game pausing
 */

class UISystem {
  constructor(gameEngine) {
    this.game = gameEngine;
    this.suitSymbols = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
    this.draggableCombo = new DraggableModal('combination-area');
    
    // 🔥 NEW: Modal management system
    this.modalManager = {
      isModalActive: false,
      currentModal: null,
      gameWasPaused: false
    };
  }

  // 🔥 NEW: CENTRALIZED MODAL DISPLAY WITH GAME PAUSING
  showModal(type, data = {}) {
  console.log(`🎪 SHOWING MODAL: ${type}`);
  
  // 🔥 CRITICAL: Pause the game during modals
  this.pauseGame();
  
  // Remove any existing modal - BUT ONLY THE DOM ELEMENT
  const existingModal = document.getElementById('game-modal-container');
  if (existingModal) {
    existingModal.remove();
  }
  
  // DON'T call this.hideModal() here - it resumes the game immediately!
    
    let modalHTML = '';
    
    switch(type) {
      case 'round_end':
        modalHTML = this.createRoundEndModal(data);
        break;
      case 'game_over':
        modalHTML = this.createGameOverModal(data);
        break;
      case 'error':
        modalHTML = this.createErrorModal(data);
        break;
      default:
        console.error(`🚨 Unknown modal type: ${type}`);
        return;
    }
    
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.id = 'game-modal-container';
    modalContainer.className = 'game-modal-overlay';
    modalContainer.innerHTML = modalHTML;
    
    // Add to DOM
    document.body.appendChild(modalContainer);
    
    // 🔥 NEW: Add event listeners for modal buttons
    if (type === 'round_end') {
      const continueBtn = modalContainer.querySelector('#continue-round-btn');
      if (continueBtn) {
        continueBtn.addEventListener('click', () => {
          console.log('🎯 Continue button clicked - UI SYSTEM');
          this.hideModal();
        });
      }
    }
    
    // Mark modal as active
    this.modalManager.isModalActive = true;
    this.modalManager.currentModal = type;
    
    // Animate in
    setTimeout(() => {
      modalContainer.classList.add('show');
    }, 50);
    
    console.log(`✅ MODAL DISPLAYED: ${type} (Game paused: ${this.modalManager.gameWasPaused})`);
  }

  // 🔥 NEW: HIDE MODAL AND RESUME GAME
hideModal() {
  const existingModal = document.getElementById('game-modal-container');
  if (existingModal) {
    existingModal.classList.add('hide');
    setTimeout(() => {
      existingModal.remove();
    }, 300);
  }
  
  // 🔥 CRITICAL: Resume the game after modal closes
  this.resumeGame();
  
  this.modalManager.isModalActive = false;
  this.modalManager.currentModal = null;
  
  console.log('🎪 MODAL HIDDEN - Game resumed');
}
  }

  // 🔥 NEW: PAUSE GAME DURING MODALS
  pauseGame() {
    // Set global pause flag
    window.gameIsPaused = true;
    
    // Disable all game interactions
    const gameContainer = document.querySelector('.table');
    if (gameContainer) {
      gameContainer.style.pointerEvents = 'none';
      gameContainer.style.opacity = '0.7';
    }
    
    // Stop any bot turn scheduling
    if (window.botTurnInProgress) {
      this.modalManager.gameWasPaused = true;
    }
    
    console.log('⏸️ GAME PAUSED for modal');
  }

  // 🔥 NEW: RESUME GAME AFTER MODAL
  resumeGame() {
    // Clear global pause flag
    window.gameIsPaused = false;
    
    // Re-enable game interactions
    const gameContainer = document.querySelector('.table');
    if (gameContainer) {
      gameContainer.style.pointerEvents = 'auto';
      gameContainer.style.opacity = '1';
    }
    
    // Resume bot turns if they were paused
    if (this.modalManager.gameWasPaused && game.state.currentPlayer !== 0) {
      console.log('🤖 RESUMING BOT TURN AFTER MODAL');
      setTimeout(() => {
        if (typeof scheduleNextBotTurn === 'function') {
          scheduleNextBotTurn();
        }
      }, 500);
    }
    
    this.modalManager.gameWasPaused = false;
    console.log('▶️ GAME RESUMED after modal');
  }

  // 🔥 NEW: CREATE ROUND END MODAL
  createRoundEndModal(data) {
    const { scores, jackpot, newRound, oldDealer, newDealer } = data;
    
    let jackpotHTML = '';
    if (jackpot && jackpot.hasJackpot) {
      jackpotHTML = `
        <div class="jackpot-announcement">
          🏆 <strong>${jackpot.winnerName}</strong> sweeps the board!<br>
          <span class="jackpot-points">+${jackpot.points} bonus points!</span>
        </div>
      `;
    }
    
    const dealerNames = ['Player', 'Bot 1', 'Bot 2'];
    
    return `
      <div class="game-modal round-end-modal">
        <div class="modal-header">
          <h2>🏁 Round ${newRound - 1} Complete!</h2>
        </div>
        <div class="modal-content">
          ${jackpotHTML}
          <div class="round-scores">
            <h3>Round Scores:</h3>
            <div class="score-grid">
              <div class="score-item ${scores.player >= scores.bot1 && scores.player >= scores.bot2 ? 'winner' : ''}">
                <span class="player-name">Player</span>
                <span class="player-score">${scores.player} pts</span>
              </div>
              <div class="score-item ${scores.bot1 >= scores.player && scores.bot1 >= scores.bot2 ? 'winner' : ''}">
                <span class="player-name">Bot 1</span>
                <span class="player-score">${scores.bot1} pts</span>
              </div>
              <div class="score-item ${scores.bot2 >= scores.player && scores.bot2 >= scores.bot1 ? 'winner' : ''}">
                <span class="player-name">Bot 2</span>
                <span class="player-score">${scores.bot2} pts</span>
              </div>
            </div>
          </div>
          <div class="round-info">
            <p><strong>Round ${newRound}</strong> starting...</p>
            <p>New dealer: <strong>${dealerNames[newDealer]}</strong></p>
          </div>
        </div>
        <div class="modal-actions">
          <button id="continue-round-btn" class="continue-btn">Continue Game →</button>
        </div>
      </div>
    `;
  }

  // 🔥 NEW: CREATE GAME OVER MODAL
  createGameOverModal(data) {
    const { scores, jackpot, winner, winnerName, winnerScore } = data;
    
    let jackpotHTML = '';
    if (jackpot && jackpot.hasJackpot) {
      jackpotHTML = `
        <div class="jackpot-announcement">
          🏆 Final sweep by <strong>${jackpot.winnerName}</strong>!<br>
          <span class="jackpot-points">+${jackpot.points} bonus points!</span>
        </div>
      `;
    }
    
    return `
      <div class="game-modal game-over-modal">
        <div class="modal-header">
          <h2>🎉 Game Over!</h2>
        </div>
        <div class="modal-content">
          <div class="winner-announcement">
            <h3>🏆 ${winnerName} Wins!</h3>
            <p class="winner-score">${winnerScore} points</p>
          </div>
          ${jackpotHTML}
          <div class="final-scores">
            <h3>Final Scores:</h3>
            <div class="score-grid">
              <div class="score-item ${winner === 0 ? 'winner' : ''}">
                <span class="player-name">Player</span>
                <span class="player-score">${scores.player} pts</span>
              </div>
              <div class="score-item ${winner === 1 ? 'winner' : ''}">
                <span class="player-name">Bot 1</span>
                <span class="player-score">${scores.bot1} pts</span>
              </div>
              <div class="score-item ${winner === 2 ? 'winner' : ''}">
                <span class="player-name">Bot 2</span>
                <span class="player-score">${scores.bot2} pts</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button onclick="initGame()" class="restart-btn">Play Again</button>
          <button onclick="window.location.href='index.html'" class="home-btn">Home</button>
        </div>
      </div>
    `;
  }

  // 🔥 NEW: CREATE ERROR MODAL
  createErrorModal(data) {
    return `
      <div class="game-modal error-modal">
        <div class="modal-header">
          <h2>⚠️ Game Error</h2>
        </div>
        <div class="modal-content">
          <p>${data.userMessage || 'An error occurred during gameplay.'}</p>
          <details>
            <summary>Technical Details</summary>
            <pre>${data.technicalDetails || 'No details available'}</pre>
          </details>
        </div>
        <div class="modal-actions">
          <button onclick="initGame()" class="restart-btn">Restart Game</button>
        </div>
      </div>
    `;
  }

  // 🎯 ENHANCED render() FUNCTION - WITH COMBO ASSISTANCE TRIGGERS
  render() {
    // 🔥 NEW: Don't render if modal is active
    if (this.modalManager.isModalActive) {
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

  // Rest of the UISystem methods remain the same...
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

  // ... [Continue with all the other existing methods] ...
  // [The rest of the UISystem class methods remain exactly the same]
  
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
    
    // 🔥 NEW: Add live sum totals for sum areas - BEAUTIFUL VERSION
    if (slotName.startsWith('sum') && cards.length > 0) {
      const sumTotal = this.calculateSumTotal(cards);
      const sumDisplay = document.createElement('div');
      sumDisplay.className = 'sum-total-display';
      sumDisplay.textContent = `[${sumTotal}]`;
      
      // Make sure parent has relative positioning and overflow visible
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
      // Ensure relative positioning is always set for sum areas
      if (slotName.startsWith('sum')) {
        areaEl.style.position = 'relative';
        areaEl.style.overflow = 'visible';
      }
    }
    
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
  }

  // 🔥 NEW: Calculate sum total for sum areas
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
    if (window.messageController && typeof window.messageController.handleGameEvent === 'function') {
      window.messageController.handleGameEvent(eventType, data);
    } else {
      console.log(`🎯 MESSAGE EVENT: ${eventType}`, data);
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
  // 🔥 BULLETPROOF FIXED: Player-aware card tracking with proper player isolation
  isCardInPlayArea(index, source, playerIndex = null) {
    return Object.values(this.game.state.combination).some(area => 
      area.some(entry => {
        // Basic source and index match
        if (entry.source !== source || entry.index !== index) {
          return false;
        }
        
        // 🔥 CRITICAL FIX: For hand cards, NEVER hide player cards during bot turns
        if (source === 'hand') {
          // If we're checking the player's hand (playerIndex = 0)
          if (playerIndex === 0) {
            // NEVER hide player cards, regardless of what's in combo areas
            // Player cards should only be hidden if THEY put them in combo areas
            const currentPlayer = this.game.state.currentPlayer;
            
            // Only hide player cards if it's the player's turn AND they put cards in combo
            if (currentPlayer === 0) {
              // Check if this entry has a playerSource property indicating it came from player
              return entry.playerSource === 0;
            }
            
            // If it's a bot turn, NEVER hide player cards
            return false;
          }
          
          // For bot hands, use existing logic
          return true;
        }
        
        // Board cards always check normally
        return true;
      })
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