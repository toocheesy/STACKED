/* 
 * 🔥 UI SYSTEM - CARDMANAGER INTEGRATION  
 * Phase 3: Single source of truth rendering - no more card hiding conflicts!
 * BULLETPROOF: UI reads from CardManager, never loses cards
 */

class UISystem {
  constructor(gameEngine) {
    this.game = gameEngine;
    this.suitSymbols = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
    this.draggableCombo = new DraggableModal('combination-area');
    
    // Modal management system
    this.modalManager = {
      isModalActive: false,
      currentModal: null,
      gameWasPaused: false
    };
    
    console.log('🎨 UI SYSTEM INITIALIZED WITH CARDMANAGER!');
  }

  // 🔥 CENTRALIZED MODAL DISPLAY WITH GAME PAUSING (unchanged)
  showModal(type, data = {}) {
    console.log(`🎪 SHOWING MODAL: ${type}`);
    
    this.pauseGame();
    
    const existingModal = document.getElementById('game-modal-container');
    if (existingModal) {
      existingModal.remove();
    }
    
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
    
    const modalContainer = document.createElement('div');
    modalContainer.id = 'game-modal-container';
    modalContainer.className = 'game-modal-overlay';
    modalContainer.innerHTML = modalHTML;
    
    document.body.appendChild(modalContainer);
    
    if (type === 'round_end') {
      this.currentRoundData = data;
    }
    
    if (type === 'round_end') {
      const continueBtn = modalContainer.querySelector('#continue-round-btn');
      if (continueBtn) {
        continueBtn.addEventListener('click', () => {
          console.log('🎯 Continue button clicked - UI SYSTEM');
          this.hideModal();
          
          if (typeof window.resumeNextRound === 'function') {
            const roundData = this.currentRoundData || data;
            window.resumeNextRound(roundData);
          }
        });
      }
    }
    
    this.modalManager.isModalActive = true;
    this.modalManager.currentModal = type;
    
    setTimeout(() => {
      modalContainer.classList.add('show');
    }, 50);
    
    console.log(`✅ MODAL DISPLAYED: ${type} (Game paused: ${this.modalManager.gameWasPaused})`);
  }

  // Hide modal and resume game (unchanged)
  hideModal() {
    const existingModal = document.getElementById('game-modal-container');
    if (existingModal) {
      existingModal.classList.add('hide');
      setTimeout(() => {
        existingModal.remove();
      }, 300);
    }
    
    this.resumeGame();
    
    this.modalManager.isModalActive = false;
    this.modalManager.currentModal = null;
    
    console.log('🎪 MODAL HIDDEN - Game resumed');
  }

  // Pause/resume game functions (unchanged)
  pauseGame() {
    window.gameIsPaused = true;
    
    const gameContainer = document.querySelector('.table');
    if (gameContainer) {
      gameContainer.style.pointerEvents = 'none';
      gameContainer.style.opacity = '0.7';
    }
    
    if (window.botTurnInProgress) {
      this.modalManager.gameWasPaused = true;
    }
    
    console.log('⏸️ GAME PAUSED for modal');
  }

  resumeGame() {
    window.gameIsPaused = false;
    
    const gameContainer = document.querySelector('.table');
    if (gameContainer) {
      gameContainer.style.pointerEvents = 'auto';
      gameContainer.style.opacity = '1';
    }
    
    if (this.modalManager.gameWasPaused && this.game.state.currentPlayer !== 0) {
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

  // Modal creation functions (unchanged - they work with CardManager data)
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

  // 🔥 NEW: RENDER WITH CARDMANAGER DATA
  render() {
    if (this.modalManager.isModalActive) {
      console.log('🎪 SKIPPING RENDER: Modal is active');
      return;
    }
    
    // 🔥 NEW: Get game state from CardManager
    const state = this.game.getState();
    
    // Connect message controller if not already connected
    if (window.messageController && !window.messageController.gameEngine) {
      this.initMessageController();
    }
    
    this.renderDeckCount(state);
    this.renderTable();
    this.renderComboArea(state);
    this.renderBoard(state);
    this.renderHands(state);
    this.renderBotHands(state);
    this.renderScores(state);
    this.renderDealerIndicator(state);
    this.updateSubmitButton(state);
    
    // Enhanced combo assistance logic
    const comboStatus = this.getComboAreaStatus(state);

    if (comboStatus.hasCards) {
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

  // 🔥 NEW: Render deck count from CardManager
  renderDeckCount(state) {
    const deckCountEl = document.getElementById('deck-count');
    if (deckCountEl) {
      deckCountEl.textContent = `Deck: ${state.deck.length || 0} cards`;
    }
  }

  // Table rendering (unchanged)
  renderTable() {
    const tableEl = document.querySelector('.table');
    if (!tableEl) return;

    // 🔥 NEW: Get board count from state
    const state = this.game.getState();
    const cardCount = state.board ? state.board.length : 0;
    
    tableEl.style.width = '800px';
    tableEl.style.maxWidth = '800px';
    tableEl.style.height = 'auto';
    
    const boardEl = document.getElementById('board');
    if (boardEl && cardCount > 8) {
      const rows = Math.ceil(cardCount / 4);
      const extraRows = rows - 2;
      const upwardShift = extraRows * 60;
      boardEl.style.transform = `translate(-50%, calc(-50% - ${upwardShift}px))`;
    } else if (boardEl) {
      boardEl.style.transform = 'translate(-50%, -50%)';
    }
    
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

  // 🔥 NEW: Render combo area with CardManager data
  renderComboArea(state) {
    const comboAreaEl = document.getElementById('combination-area');
    
    if (!comboAreaEl) return;

    const baseEl = comboAreaEl.querySelector('[data-slot="base"]');
    const sum1El = comboAreaEl.querySelector('[data-slot="sum1"]');
    const sum2El = comboAreaEl.querySelector('[data-slot="sum2"]');
    const sum3El = comboAreaEl.querySelector('[data-slot="sum3"]');
    const matchEl = comboAreaEl.querySelector('[data-slot="match"]');
    
    if (!(baseEl && sum1El && sum2El && sum3El && matchEl)) return;

    // 🔥 NEW: Render each area with CardManager data
    this.renderArea(baseEl, state.combination.base, 'base', 'Base Card');
    this.renderArea(sum1El, state.combination.sum1, 'sum1', 'Sum Cards');
    this.renderArea(sum2El, state.combination.sum2, 'sum2', 'Sum Cards');
    this.renderArea(sum3El, state.combination.sum3, 'sum3', 'Sum Cards');
    this.renderArea(matchEl, state.combination.match, 'match', 'Matching Cards');

    // Validate combinations
    this.validateAndStyleComboArea(baseEl, sum1El, sum2El, sum3El, matchEl, state);

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

  // 🔥 UPDATED: Validate combo area with CardManager data
  validateAndStyleComboArea(baseEl, sum1El, sum2El, sum3El, matchEl, state) {
    let validCaptures = [];
    let isAnyValid = false;

    if (state.combination.base.length === 1) {
      const baseCard = state.combination.base[0];
      const baseValue = parseInt(baseCard.card.value) || 1;

      const areas = [
        { el: sum1El, cards: state.combination.sum1, name: 'Sum Area 1' },
        { el: sum2El, cards: state.combination.sum2, name: 'Sum Area 2' },
        { el: sum3El, cards: state.combination.sum3, name: 'Sum Area 3' },
        { el: matchEl, cards: state.combination.match, name: 'Match Area' }
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

  // 🔥 NEW: Render area with proper sum calculations
  renderArea(areaEl, cards, slotName, placeholderText) {
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
    } else if (slotName.startsWith('sum')) {
      areaEl.style.position = 'relative';
      areaEl.style.overflow = 'visible';
    }
    
    if (cards.length > 0) {
      cards.forEach((comboEntry, comboIndex) => {
        // 🔥 NEW: Handle CardManager combo format
        const card = comboEntry.card || comboEntry;
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

  // Calculate sum total (unchanged)
  calculateSumTotal(cards) {
    return cards.reduce((total, comboEntry) => {
      const card = comboEntry.card || comboEntry;
      let value = 0;
      
      if (card.value === 'A') {
        value = 1;
      } else if (['J', 'Q', 'K'].includes(card.value)) {
        value = 10;
      } else {
        value = parseInt(card.value) || 0;
      }
      
      return total + value;
    }, 0);
  }

  // 🔥 NEW: Render board with CardManager data
  renderBoard(state) {
    const boardEl = document.getElementById('board');
    if (!boardEl) return;

    boardEl.innerHTML = '';
    
    if (state.board && Array.isArray(state.board)) {
      state.board.forEach((card, index) => {
        // 🔥 NEW: No more card hiding logic - CardManager handles everything!
        const cardEl = this.createCardElement(card, index, 'board');
        boardEl.appendChild(cardEl);
      });
    }

    boardEl.addEventListener('dragover', (e) => e.preventDefault());
    boardEl.addEventListener('drop', window.handleBoardDrop);
    boardEl.addEventListener('touchend', (e) => window.handleTouchDrop(e, 'board'));
  }

  // 🔥 NEW: Render hands with CardManager data
  renderHands(state) {
    const handEl = document.getElementById('player-hand');
    if (!handEl) return;

    handEl.innerHTML = '';
    
    // 🔥 NEW: Always show 4 slots, fill with actual cards
    for (let index = 0; index < 4; index++) {
      const card = state.hands[0] && state.hands[0][index] ? state.hands[0][index] : null;
      const cardEl = document.createElement('div');
      
      if (card) {
        this.setupCardElement(cardEl, card, index, 'hand');
      } else {
        this.createEmptyCardSlot(cardEl, index, 'hand');
      }
      
      handEl.appendChild(cardEl);
    }
  }

  // 🔥 NEW: Render bot hands with CardManager data
  renderBotHands(state) {
    const bot1HandEl = document.getElementById('bot1-hand');
    const bot2HandEl = document.getElementById('bot2-hand');
    
    if (bot1HandEl) {
      bot1HandEl.innerHTML = '';
      const bot1Cards = state.hands[1] || [];
      
      for (let i = 0; i < 4; i++) {
        const cardEl = document.createElement('div');
        
        if (i < bot1Cards.length) {
          cardEl.className = 'card back';
          cardEl.style.visibility = 'visible';
        } else {
          cardEl.className = 'card back';
          cardEl.style.visibility = 'hidden';
        }
        
        bot1HandEl.appendChild(cardEl);
      }
    }

    if (bot2HandEl) {
      bot2HandEl.innerHTML = '';
      const bot2Cards = state.hands[2] || [];
      
      for (let i = 0; i < 4; i++) {
        const cardEl = document.createElement('div');
        
        if (i < bot2Cards.length) {
          cardEl.className = 'card back';
          cardEl.style.visibility = 'visible';
        } else {
          cardEl.className = 'card back';
          cardEl.style.visibility = 'hidden';
        }
        
        bot2HandEl.appendChild(cardEl);
      }
    }
  }

  // Render scores with CardManager data
  renderScores(state) {
    const playerScoreEl = document.getElementById('player-score');
    const bot1ScoreEl = document.getElementById('bot1-score');
    const bot2ScoreEl = document.getElementById('bot2-score');
    
    if (playerScoreEl) playerScoreEl.textContent = `Player: ${state.scores.player} pts`;
    if (bot1ScoreEl) bot1ScoreEl.textContent = `Bot 1: ${state.scores.bot1} pts`;
    if (bot2ScoreEl) bot2ScoreEl.textContent = `Bot 2: ${state.scores.bot2} pts`;
  }

  // 🔥 NEW: Render dealer indicator with CardManager data
  renderDealerIndicator(state) {
    const existingDealer = document.querySelector('.dealer-indicator');
    if (existingDealer) existingDealer.remove();

    const dealerEl = document.createElement('div');
    dealerEl.className = 'dealer-indicator';
    
    const dealerNames = ['Player', 'Bot 1', 'Bot 2'];
    const deckCount = state.deck ? state.deck.length : 0;
    dealerEl.textContent = `${dealerNames[this.game.currentDealer]} Deals • Deck: ${deckCount}`;
    
    if (this.game.currentDealer === 0) {
      dealerEl.classList.add('player-dealer');
    } else if (this.game.currentDealer === 1) {
      dealerEl.classList.add('bot1-dealer');
    } else {
      dealerEl.classList.add('bot2-dealer');
    }
    
    document.querySelector('.table')?.appendChild(dealerEl);
  }

  // 🔥 NEW: Update submit button with CardManager data
  updateSubmitButton(state) {
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      const hasBaseCard = state.combination.base.length === 1;
      const hasAnyCaptureCards = state.combination.sum1.length > 0 || 
                               state.combination.sum2.length > 0 || 
                               state.combination.sum3.length > 0 || 
                               state.combination.match.length > 0;
      
      submitBtn.disabled = !(state.currentPlayer === 0 && hasBaseCard && hasAnyCaptureCards);
    }
  }

  // Message system integration (unchanged)
  updateMessage() {
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

  // 🔥 NEW: Get combo area status with CardManager data
  getComboAreaStatus(state) {
    const combo = state.combination;
    const totalCards = combo.base.length + combo.sum1.length + combo.sum2.length + combo.sum3.length + combo.match.length;
    
    return {
      hasCards: totalCards > 0,
      cardCount: totalCards,
      hasBase: combo.base.length > 0,
      baseCard: combo.base.length > 0 ? combo.base[0].card || combo.base[0] : null,
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

  // Helper functions (updated for CardManager)
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