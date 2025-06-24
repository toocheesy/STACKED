/* 
 * Updated main.js with Scoreboard Modal System
 * Includes original game logic and new modal for round-end/game-over
 * Integrates with state.scores, smartMessages, and playSound
 */

/* SECTION: Existing Game State and Systems */
let state = {
  deck: [],
  board: [],
  hands: [[], [], []], // Player, Bot 1, Bot 2
  scores: { player: 0, bot1: 0, bot2: 0 },
  combination: { base: [], sum1: [], sum2: [], sum3: [], match: [] },
  currentPlayer: 0,
  settings: {
    cardSpeed: 'fast',
    soundEffects: 'off',
    targetScore: 500,
    botDifficulty: 'intermediate'
  },
  draggedCard: null,
  selectedCard: null,
  lastCapturer: null
};

let botTurnInProgress = false;
let currentRound = 1; // Track actual rounds

// Base64-encoded audio files (shortened; use real base64 audio in production)
const sounds = {
  capture: new Audio('./audio/capture.mp3'),
  invalid: new Audio('./audio/invalid.mp3'),
  winner: new Audio('./audio/winner.mp3'),
  jackpot: new Audio('./audio/jackpot.mp3')
};

const suitSymbols = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };

// Smart Contextual Error Detection System
class SmartMessageSystem {
  constructor() {
    this.messageElement = document.getElementById('smart-message');
    this.defaultMessage = "Drag cards to build captures or place one on board to end turn • Score 500 to win!";
    this.currentTimeout = null;
  }

  updateMessage(gameState = 'default') {
    let message = this.getContextualMessage(gameState);
    this.showMessage(message);
  }

  getContextualMessage(context) {
    switch(context) {
      case 'turn_start':
        return "Drag cards to build captures or place one on board to end turn";
      case 'cards_in_areas':
        return "Submit your capture or reset to try again";
      case 'game_over_player':
        return "🎉 Game Over! You win! 🎉";
      case 'game_over_bot':
        return "Game Over! Bot wins this round - try again!";
      case 'valid_combo':
        return "✅ Valid combo! Click Submit Move to capture";
      default:
        return this.defaultMessage;
    }
  }

  showErrorMessage(errorText) {
    this.showMessage(`❌ ${errorText}`, 'error');
    if (typeof playSound === 'function') {
      playSound('invalid');
    }
  }

  showSuccessMessage(successText) {
    this.showMessage(`✅ ${successText}`, 'success');
  }

  showMessage(text, type = 'normal') {
    if (!this.messageElement) return;
    
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }

    this.messageElement.textContent = text;
    this.messageElement.className = 'smart-message';
    if (type === 'error') {
      this.messageElement.classList.add('error-message');
    } else if (type === 'success') {
      this.messageElement.classList.add('success-message');
    }

    if (type !== 'normal') {
      this.currentTimeout = setTimeout(() => {
        this.updateMessage('default');
        this.messageElement.className = 'smart-message';
      }, 3000);
    }
  }
}

const smartMessages = new SmartMessageSystem();

// Draggable Modal System
class DraggableModal {
  constructor(elementId) {
    this.modal = document.getElementById(elementId);
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.initialX = 0;
    this.initialY = 0;
    
    if (this.modal) {
      this.init();
    }
  }
  
  init() {
    const titleBar = this.modal.querySelector('.modal-title');
    if (titleBar) {
      titleBar.style.cursor = 'move';
      titleBar.addEventListener('mousedown', (e) => this.startDrag(e));
    }
    
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.stopDrag());
  }
  
  startDrag(e) {
    this.isDragging = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    
    const rect = this.modal.getBoundingClientRect();
    this.initialX = rect.left;
    this.initialY = rect.top;
    
    this.modal.style.transition = 'none';
  }
  
  drag(e) {
    if (!this.isDragging) return;
    
    e.preventDefault();
    
    const deltaX = e.clientX - this.startX;
    const deltaY = e.clientY - this.startY;
    
    const newX = this.initialX + deltaX;
    const newY = this.initialY + deltaY;
    
    const maxX = window.innerWidth - this.modal.offsetWidth;
    const maxY = window.innerHeight - this.modal.offsetHeight;
    
    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));
    
    this.modal.style.left = boundedX + 'px';
    this.modal.style.top = boundedY + 'px';
    this.modal.style.right = 'auto';
  }
  
  stopDrag() {
    this.isDragging = false;
    this.modal.style.transition = '';
  }
}

// Bot Modal Interface System
class BotModalInterface {
  constructor() {
    this.isAnimating = false;
  }

  async botDragCardToSlot(card, sourceType, sourceIndex, targetSlot) {
    if (this.isAnimating) return false;
    this.isAnimating = true;

    console.log(`🤖 BOT: Dragging ${card.value}${card.suit} from ${sourceType}[${sourceIndex}] to ${targetSlot}`);

    const cardEntry = {
      source: sourceType,
      index: sourceIndex,
      card: card
    };

    if (targetSlot === 'base') {
      if (state.combination.base.length > 0) {
        console.log(`🤖 BOT: Clearing existing base card`);
        state.combination.base = [];
      }
    }

    state.combination[targetSlot].push(cardEntry);
    render();
    await this.delay(500);
    this.isAnimating = false;
    return true;
  }

  async botSubmitCapture() {
    if (this.isAnimating) return false;
    this.isAnimating = true;

    console.log(`🤖 BOT: Attempting to submit capture`);
    await this.delay(300);

    const success = this.executeBotSubmit();
    
    if (success) {
      console.log(`🤖 BOT: Capture successful!`);
      const currentPlayer = state.currentPlayer;
      if (state.hands[currentPlayer].length > 0) {
        console.log(`🤖 BOT ${currentPlayer}: Has ${state.hands[currentPlayer].length} cards left, continuing turn`);
        setTimeout(async () => await aiTurn(), 1000);
      } else {
        console.log(`🤖 BOT ${currentPlayer}: Out of cards, turn managed in submit`);
      }
    } else {
      console.log(`🤖 BOT: Capture failed, placing card instead`);
    }

    await this.delay(500);
    this.isAnimating = false;
    return success;
  }

// REPLACE your executeBotSubmit function with this CLEANED version:

executeBotSubmit() {
  const baseCards = state.combination.base;
  const currentPlayer = state.currentPlayer;

  if (baseCards.length !== 1) {
    console.log(`🚨 BOT SUBMIT FAILED: Base card count = ${baseCards.length}`);
    return false;
  }

  const baseCard = baseCards[0];
  const baseValue = baseCard.card.value; // Keep as string for flexible matching

  let validCaptures = [];
  let allCapturedCards = [baseCard.card];

  // ALL SLOTS ARE NOW INTERCHANGEABLE - use the same validation for all
  const captureAreas = [
    { name: 'sum1', cards: state.combination.sum1 },
    { name: 'sum2', cards: state.combination.sum2 },
    { name: 'sum3', cards: state.combination.sum3 },
    { name: 'match', cards: state.combination.match }
  ];

  for (const area of captureAreas) {
    if (area.cards.length > 0) {
      // SMART VALIDATION: Each area can be either pair OR sum
      const result = validateCaptureArea(area.cards, baseValue, baseCard, area.name);

      if (result.isValid) {
        validCaptures.push({ name: area.name, cards: area.cards, type: result.captureType });
        allCapturedCards.push(...area.cards.map(entry => entry.card));
        console.log(`✅ BOT ${area.name}: ${result.details}`);
      } else {
        console.log(`🚨 BOT VALIDATION FAILED: ${area.name} - ${result.details}`);
        return false;
      }
    }
  }

  if (validCaptures.length === 0) {
    console.log(`🚨 BOT SUBMIT FAILED: No valid captures`);
    return false;
  }

  console.log(`🎯 BOT MULTI-CAPTURE: ${validCaptures.length} areas, ${allCapturedCards.length} cards`);

  // FIXED: Use the new executeCapture function that handles scoring
  executeCapture(baseCard, validCaptures, allCapturedCards);
  state.lastCapturer = currentPlayer;

  // REMOVED: Duplicate scoring code (now handled in executeCapture)

  // Reset combination state
  state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };

  // Handle turn continuation
  if (state.hands[currentPlayer].length > 0) {
    console.log(`🤖 BOT ${currentPlayer}: Can continue, staying current player`);
  } else {
    state.currentPlayer = (currentPlayer + 1) % 3;
    console.log(`🤖 BOT ${currentPlayer}: Out of cards, switching to player ${state.currentPlayer}`);
    if (state.currentPlayer !== 0 && state.hands[state.currentPlayer] && state.hands[state.currentPlayer].length > 0) {
      setTimeout(async () => await scheduleNextBotTurn(), 1000);
    }
  }

  render();
  playSound('capture');
  return true;
}

  async botResetModal() {
    if (this.isAnimating) return false;
    this.isAnimating = true;

    console.log(`🤖 BOT: Resetting modal`);
    state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
    render();
    await this.delay(300);
    this.isAnimating = false;
    return true;
  }

  async botPlaceCard(card, handIndex) {
    if (this.isAnimating) return false;
    this.isAnimating = true;

    console.log(`🤖 BOT: Placing ${card.value}${card.suit} on board to end turn`);
    await this.delay(500);

    const currentPlayer = state.currentPlayer;
    state.board.push(card);
    state.hands[currentPlayer] = state.hands[currentPlayer].filter((_, i) => i !== handIndex);
    state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
    state.currentPlayer = (currentPlayer + 1) % 3;
    
    render();
    checkGameEnd();

    if (state.currentPlayer !== 0 && state.hands[state.currentPlayer] && state.hands[state.currentPlayer].length > 0) {
      console.log(`🔄 BOT PLACED CARD - CONTINUING TO PLAYER ${state.currentPlayer}`);
      setTimeout(async () => await scheduleNextBotTurn(), 1000);
    }

    this.isAnimating = false;
    return true;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  canBotCapture(hand, board) {
    return hand.length > 0 && board.length > 0;
  }
}

const botModal = new BotModalInterface();
const draggableCombo = new DraggableModal('combination-area');

/* SECTION: Scoreboard Modal System */
function rankPlayers() {
  const players = [
    { name: 'Player', score: state.scores.player, index: 0 },
    { name: 'Bot 1', score: state.scores.bot1, index: 1 },
    { name: 'Bot 2', score: state.scores.bot2, index: 2 }
  ];
  return players.sort((a, b) => b.score - a.score);
}

function createConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.animationDelay = `${Math.random() * 2}s`;
    container.appendChild(confetti);
  }
}

function showRoundEndModal(jackpotMessage, currentRound) {
  const modal = document.getElementById('scoreboard-modal');
  if (!modal) return;

  const jackpotEl = document.getElementById('jackpot-message');
  const titleEl = document.getElementById('scoreboard-title');
  const listEl = document.getElementById('scoreboard-list');
  const buttonsEl = document.getElementById('scoreboard-buttons');
  const confettiEl = document.getElementById('confetti-container');

  if (jackpotEl && titleEl && listEl && buttonsEl && confettiEl) {
    jackpotEl.textContent = jackpotMessage || '';
    jackpotEl.classList.toggle('visible', !!jackpotMessage);
    titleEl.textContent = `Round ${currentRound} Scores`;
    confettiEl.classList.remove('active');

    const rankedPlayers = rankPlayers();
    listEl.innerHTML = rankedPlayers.map((player, index) => `
      <div class="scoreboard-item ${index === 0 ? 'leader' : ''}">
        <span class="scoreboard-rank">${['🥇', '🥈', '🥉'][index] || ''}</span>
        <span class="scoreboard-name">${player.name}</span>
        <span class="scoreboard-score">${player.score} pts</span>
      </div>
    `).join('');

    buttonsEl.innerHTML = `
      <button id="next-round-btn">Next Round</button>
    `;

    modal.showModal();
    playSound('jackpot');

    const nextRoundBtn = document.getElementById('next-round-btn');
    if (nextRoundBtn) {
      nextRoundBtn.addEventListener('click', () => {
        modal.close();
        try {
          const newDeck = shuffleDeck(createDeck());
          const dealResult = dealCards(newDeck, 3, 4, 4);
          state.hands = dealResult.players;
          state.board = dealResult.board;
          state.deck = dealResult.remainingDeck;
          state.currentPlayer = 0;
          state.lastCapturer = null;
          smartMessages.updateMessage('turn_start');
          render();
        } catch (e) {
          console.error('Error dealing new round:', e);
          smartMessages.showErrorMessage('Error dealing cards! Restart the game.');
        }
      });
    }

    setTimeout(() => {
      if (modal.open) {
        buttonsEl.querySelectorAll('button').forEach(btn => btn.disabled = false);
      }
    }, 3000);
  }
}

function showGameOverModal(jackpotMessage, totalRounds) {
  const modal = document.getElementById('scoreboard-modal');
  if (!modal) return;

  const jackpotEl = document.getElementById('jackpot-message');
  const titleEl = document.getElementById('scoreboard-title');
  const listEl = document.getElementById('scoreboard-list');
  const buttonsEl = document.getElementById('scoreboard-buttons');
  const confettiEl = document.getElementById('confetti-container');

  if (jackpotEl && titleEl && listEl && buttonsEl && confettiEl) {
    jackpotEl.textContent = jackpotMessage || '';
    jackpotEl.classList.toggle('visible', !!jackpotMessage);
    titleEl.textContent = 'Game Over!';
    createConfetti();
    confettiEl.classList.add('active');

    const rankedPlayers = rankPlayers();
    listEl.innerHTML = rankedPlayers.map((player, index) => `
      <div class="scoreboard-item ${index === 0 ? 'leader' : ''}">
        <span class="scoreboard-rank">${['🥇', '🥈', '🥉'][index] || ''}</span>
        <span class="scoreboard-name">${player.name}</span>
        <span class="scoreboard-score">${player.score} pts</span>
      </div>
    `).join('');

    buttonsEl.innerHTML = `
      <button id="new-game-btn">New Game</button>
    `;

    modal.showModal();
    playSound('winner');

    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => {
        modal.close();
        initGame();
      });
    }

    setTimeout(() => {
      if (modal.open) {
        buttonsEl.querySelectorAll('button').forEach(btn => btn.disabled = false);
      }
    }, 3000);
  }
}

/* SECTION: Game Initialization and Core Logic */
// ADD THIS TO THE END OF YOUR initGame() function, right before render():

function initGame() {
  let deck;
  try {
    deck = shuffleDeck(createDeck());
  } catch (e) {
    console.error('Failed to create/shuffle deck:', e);
    deck = createDeck();
  }

  let dealResult;
  try {
    dealResult = dealCards(deck);
  } catch (e) {
    console.error('Failed to deal cards:', e);
    dealResult = { players: [[], [], []], board: [], remainingDeck: deck };
  }

  state.deck = dealResult.remainingDeck || deck;
  state.board = dealResult.board || [];
  state.hands = dealResult.players && dealResult.players.length === 3 ? dealResult.players : [[], [], []];
  state.hands = state.hands.map(hand => {
    if (hand.length === 0 && state.deck.length >= 4) {
      return state.deck.splice(0, 4);
    }
    return hand;
  });
  state.scores = { player: 0, bot1: 0, bot2: 0 };
  state.currentPlayer = 0;
  state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
  state.draggedCard = null;
  state.selectedCard = null;
  currentRound = 1; // Reset round counter when starting new game
  
  // FORCE CLOSE ANY OPEN MODALS
  const scoreboardModal = document.getElementById('scoreboard-modal');
  if (scoreboardModal && scoreboardModal.open) {
    scoreboardModal.close();
  }
  
  render();
  showSettingsModal();
  playSound('capture');
}

function playSound(type) {
  if (state.settings.soundEffects === 'on' && sounds[type]) {
    sounds[type].play().catch(e => console.error('Sound play failed:', e));
  }
}

function showSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.showModal();

    const startGameBtn = document.getElementById('start-game-btn');
    const tutorialBtn = document.getElementById('tutorial-btn');
    const tutorialModal = document.getElementById('tutorial-modal');

    if (startGameBtn) {
      startGameBtn.addEventListener('click', () => {
        state.settings.cardSpeed = document.getElementById('card-speed').value;
        state.settings.soundEffects = document.getElementById('sound-effects').value;
        state.settings.targetScore = parseInt(document.getElementById('target-score').value);
        state.settings.botDifficulty = document.getElementById('bot-difficulty').value;
        modal.close();
        render();
      });
    }

    if (tutorialBtn) {
      tutorialBtn.addEventListener('click', () => {
        tutorialModal.showModal();
      });
    }
  }
}

function provideHint() {
  if (state.currentPlayer !== 0) return;
  const possibleCaptures = [];
  for (const [index, card] of state.hands[0].entries()) {
    const captures = canCapture(card, state.board);
    captures.forEach(capture => {
      possibleCaptures.push({ handIndex: index, capture });
    });
  }

  if (possibleCaptures.length === 0) {
    const messageEl = document.getElementById('message');
    if (messageEl) messageEl.textContent = "No valid captures available. Place a card to end your turn.";
    return;
  }

  const hint = possibleCaptures[Math.floor(Math.random() * possibleCaptures.length)];
  const handCardEl = document.querySelector(`#player-hand .card[data-index="${hint.handIndex}"]`);
  const boardCardEls = hint.capture.cards.map(idx => 
    document.querySelector(`#board .card[data-index="${idx}"]`)
  );

  if (handCardEl) handCardEl.classList.add('hint');
  boardCardEls.forEach(el => el && el.classList.add('hint'));

  setTimeout(() => {
    if (handCardEl) handCardEl.classList.remove('hint');
    boardCardEls.forEach(el => el && el.classList.remove('hint'));
    const messageEl = document.getElementById('message');
    if (messageEl) messageEl.textContent = "Hint: Try combining the highlighted cards!";
  }, 3000);
}

function render() {
  const deckCountEl = document.getElementById('deck-count');
  if (deckCountEl) {
    deckCountEl.textContent = `Deck: ${state.deck.length || 0} cards`;
  }

  const tableEl = document.querySelector('.table');
if (tableEl) {
  const cardCount = state.board ? state.board.length : 0;
  
  // Keep table size consistent - don't expand it
  tableEl.style.width = '100%';
  tableEl.style.height = 'auto';
  
  // Adjust board position based on card count to expand upward
  const boardEl = document.getElementById('board');
  if (boardEl && cardCount > 8) {
    const rows = Math.ceil(cardCount / 4);
    const extraRows = rows - 2; // Base is 2 rows (8 cards)
    const upwardShift = extraRows * 60; // Move up by 60px per extra row
    boardEl.style.transform = `translate(-50%, calc(-50% - ${upwardShift}px))`;
  } else if (boardEl) {
    boardEl.style.transform = 'translate(-50%, -50%)'; // Reset to center
  }
  
  // Keep bot positions stable
  const bot1HandEl = document.querySelector('.bot1-hand');
  const bot2HandEl = document.querySelector('.bot2-hand');
  if (bot1HandEl) bot1HandEl.style.left = '-20px';
  if (bot2HandEl) bot2HandEl.style.right = '-20px';
}

  const comboAreaEl = document.getElementById('combination-area');
  let captureTypeMessage = "No cards in play areas.";
  
  if (comboAreaEl) {
    const baseEl = comboAreaEl.querySelector('[data-slot="base"]');
    const sum1El = comboAreaEl.querySelector('[data-slot="sum1"]');
    const sum2El = comboAreaEl.querySelector('[data-slot="sum2"]');
    const sum3El = comboAreaEl.querySelector('[data-slot="sum3"]');
    const matchEl = comboAreaEl.querySelector('[data-slot="match"]');
    
    if (baseEl && sum1El && sum2El && sum3El && matchEl) {
      renderArea(baseEl, state.combination.base, 'base', 'Base Card');
      renderArea(sum1El, state.combination.sum1, 'sum1', 'Sum Cards');
      renderArea(sum2El, state.combination.sum2, 'sum2', 'Sum Cards');
      renderArea(sum3El, state.combination.sum3, 'sum3', 'Sum Cards');
      renderArea(matchEl, state.combination.match, 'match', 'Matching Cards');

      let validCaptures = [];
      let isAnyValid = false;

      if (state.combination.base.length === 1) {
        const baseCard = state.combination.base[0];
        const baseValue = parseInt(baseCard.card.value) || (window.valueMap && window.valueMap[baseCard.card.value]) || 1;

        if (state.combination.sum1.length > 0) {
          const result = validateSumCapture(state.combination.sum1, baseValue, baseCard);
          if (result.isValid) {
            validCaptures.push(`Sum Area 1: ${result.details}`);
            sum1El.classList.add('valid-combo');
            isAnyValid = true;
          } else {
            sum1El.classList.remove('valid-combo');
          }
        }

        if (state.combination.sum2.length > 0) {
          const result = validateSumCapture(state.combination.sum2, baseValue, baseCard);
          if (result.isValid) {
            validCaptures.push(`Sum Area 2: ${result.details}`);
            sum2El.classList.add('valid-combo');
            isAnyValid = true;
          } else {
            sum2El.classList.remove('valid-combo');
          }
        }

        if (state.combination.sum3.length > 0) {
          const result = validateSumCapture(state.combination.sum3, baseValue, baseCard);
          if (result.isValid) {
            validCaptures.push(`Sum Area 3: ${result.details}`);
            sum3El.classList.add('valid-combo');
            isAnyValid = true;
          } else {
            sum3El.classList.remove('valid-combo');
          }
        }

        if (state.combination.match.length > 0) {
          const result = validateMatchCapture(state.combination.match, baseValue, baseCard);
          if (result.isValid) {
            validCaptures.push(`Match Area: ${result.details}`);
            matchEl.classList.add('valid-combo');
            isAnyValid = true;
          } else {
            matchEl.classList.remove('valid-combo');
          }
        }

        if (isAnyValid) {
          baseEl.classList.add('valid-combo');
          captureTypeMessage = `Valid Captures: ${validCaptures.join(' | ')}`;
        } else {
          baseEl.classList.remove('valid-combo');
          captureTypeMessage = "Invalid: Capture areas must match Base Card value.";
        }
      } else {
        [baseEl, sum1El, sum2El, sum3El, matchEl].forEach(el => el.classList.remove('valid-combo'));
        captureTypeMessage = state.combination.base.length === 0 
          ? "Add a Base Card to start building captures."
          : "Invalid: Base Card area must have exactly one card.";
      }

      const areas = [
        { el: baseEl, slot: 'base' },
        { el: sum1El, slot: 'sum1' },
        { el: sum2El, slot: 'sum2' },
        { el: sum3El, slot: 'sum3' },
        { el: matchEl, slot: 'match' }
      ];

      areas.forEach(({ el, slot }) => {
        el.addEventListener('dragover', (e) => e.preventDefault());
        el.addEventListener('drop', (e) => handleDrop(e, slot));
        el.addEventListener('touchend', (e) => handleTouchDrop(e, 'combo', slot));
      });
    }
  }

  const captureTypeEl = document.getElementById('capture-type');
  if (captureTypeEl) {
    captureTypeEl.textContent = captureTypeMessage;
  }

  renderBoard();
  renderHands();
  renderBotHands();
  renderScores();
  updateSubmitButton();
  updateMessage();
  
  const hasCardsInAreas = Object.values(state.combination).some(area => area.length > 0);
  if (hasCardsInAreas) {
    smartMessages.updateMessage('cards_in_areas');
  } else if (state.currentPlayer === 0) {
    smartMessages.updateMessage('turn_start');
  }
}

function renderArea(areaEl, cards, slotName, placeholderText) {
  areaEl.innerHTML = '';
  
  if (cards.length > 0) {
    cards.forEach((comboEntry, comboIndex) => {
      const card = comboEntry.card;
      const cardEl = document.createElement('div');
      cardEl.className = `card ${card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : ''}`;
      cardEl.textContent = `${card.value}${suitSymbols[card.suit]}`;
      cardEl.style.position = 'absolute';
      cardEl.style.top = `${comboIndex * 20}px`;
      cardEl.setAttribute('draggable', 'true');
      cardEl.setAttribute('data-slot', slotName);
      cardEl.setAttribute('data-combo-index', comboIndex);
      cardEl.addEventListener('dragstart', (e) => handleDragStartCombo(e, slotName, comboIndex));
      cardEl.addEventListener('dragend', handleDragEnd);
      cardEl.addEventListener('touchstart', (e) => handleTouchStart(e, 'combo', { slot: slotName, comboIndex }));
      cardEl.addEventListener('touchend', handleTouchEnd);
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

function validateCaptureArea(areaCards, baseValue, baseCard, areaName) {
  const hasHandCard = areaCards.some(entry => entry.source === 'hand') || baseCard.source === 'hand';
  const hasBoardCard = areaCards.some(entry => entry.source === 'board') || baseCard.source === 'board';
  
  if (!hasHandCard || !hasBoardCard) {
    return { isValid: false, details: "Requires hand + board cards" };
  }

  // SMART DETECTION: Try both pair and sum validation
  const pairResult = validatePairLogic(areaCards, baseCard);
  const sumResult = validateSumLogic(areaCards, baseCard);
  
  // Return whichever one is valid (prefer pair if both work)
  if (pairResult.isValid) {
    return { 
      isValid: true, 
      details: `PAIR: ${pairResult.details}`,
      captureType: 'pair'
    };
  } else if (sumResult.isValid) {
    return { 
      isValid: true, 
      details: `SUM: ${sumResult.details}`,
      captureType: 'sum'
    };
  } else {
    return { 
      isValid: false, 
      details: `Not valid as pair (${pairResult.details}) or sum (${sumResult.details})`
    };
  }
}

function validatePairLogic(areaCards, baseCard) {
  // Check if all cards match the base card value
  const allMatch = areaCards.every(entry => entry.card.value === baseCard.card.value);
  
  if (allMatch) {
    return { 
      isValid: true, 
      details: `${areaCards.length + 1} cards matching ${baseCard.card.value}` 
    };
  } else {
    return { 
      isValid: false, 
      details: "Cards don't match base card value" 
    };
  }
}

function validateSumLogic(areaCards, baseCard) {
  // Face cards cannot be used in sum captures
  if (['J', 'Q', 'K'].includes(baseCard.card.value)) {
    return { isValid: false, details: "Face cards can't be used in sum captures" };
  }

  // Check if any area cards are face cards
  const hasFaceCards = areaCards.some(entry => ['J', 'Q', 'K'].includes(entry.card.value));
  if (hasFaceCards) {
    return { isValid: false, details: "Face cards can't be used in sums" };
  }

  // Calculate sum
  const areaValues = areaCards.map(entry => 
    entry.card.value === 'A' ? 1 : parseInt(entry.card.value)
  );
  const totalSum = areaValues.reduce((a, b) => a + b, 0);
  const baseNumValue = baseCard.card.value === 'A' ? 1 : parseInt(baseCard.card.value);

  if (totalSum === baseNumValue) {
    return { 
      isValid: true, 
      details: `${areaValues.join(' + ')} = ${baseNumValue}` 
    };
  } else {
    return { 
      isValid: false, 
      details: `${areaValues.join(' + ')} = ${totalSum} ≠ ${baseNumValue}` 
    };
  }
}

// Keep these wrapper functions for compatibility
function validateSumCapture(sumCards, baseValue, baseCard) {
  return validateCaptureArea(sumCards, baseValue, baseCard, 'sum');
}

function validateMatchCapture(matchCards, baseValue, baseCard) {
  return validateCaptureArea(matchCards, baseValue, baseCard, 'match');
}

function handleDragStart(e, source, index) {
  if (state.currentPlayer !== 0) return;
  state.draggedCard = { source, index, card: source === 'hand' ? state.hands[0][index] : state.board[index] };
  e.target.classList.add('selected');
}

function handleDragStartCombo(e, slot, comboIndex) {
  if (state.currentPlayer !== 0) return;
  state.draggedCard = state.combination[slot][comboIndex];
  state.draggedCard.slot = slot;
  state.draggedCard.comboIndex = comboIndex;
  e.target.classList.add('selected');
}

function handleDragEnd(e) {
  e.target.classList.remove('selected');
  state.draggedCard = null;
}

function handleTouchStart(e, source, data) {
  if (state.currentPlayer !== 0) return;
  e.preventDefault();
  const target = e.target;
  target.classList.add('selected');
  state.selectedCard = { source, index: data, element: target };

  target.style.transform = 'scale(1.1)';
  setTimeout(() => {
    if (target.classList.contains('selected')) {
      target.style.transform = 'scale(1)';
    }
  }, 1000);
}

function handleTouchEnd(e) {
  if (state.currentPlayer !== 0 || !state.selectedCard) return;
  e.preventDefault();
  state.selectedCard.element.classList.remove('selected');
  state.selectedCard.element.style.transform = 'scale(1)';
  state.selectedCard = null;
}

function handleDrop(e, slot) {
  e.preventDefault();
  if (state.currentPlayer !== 0 || !state.draggedCard) return;

  if (state.draggedCard.slot !== undefined) {
    state.combination[state.draggedCard.slot] = state.combination[state.draggedCard.slot].filter((_, i) => i !== state.draggedCard.comboIndex);
  }

  if (slot === 'base' && state.combination.base.length > 0) {
    const existingBase = state.combination.base[0];
    state.combination.base = [];
    if (state.combination.sum1.length === 0) {
      state.combination.sum1.push(existingBase);
    } else if (state.combination.sum2.length === 0) {
      state.combination.sum2.push(existingBase);
    } else if (state.combination.sum3.length === 0) {
      state.combination.sum3.push(existingBase);
    } else {
      state.combination.match.push(existingBase);
    }
  }

  state.combination[slot].push({
    source: state.draggedCard.source,
    index: state.draggedCard.index,
    card: state.draggedCard.card
  });

  console.log(`🔧 CARD DROPPED: ${state.draggedCard.card.value}${state.draggedCard.card.suit} to slot ${slot}`);
  state.draggedCard = null;
  render();
}

function handleTouchDrop(e, targetType, data) {
  e.preventDefault();
  if (state.currentPlayer !== 0 || !state.selectedCard) return;

  if (targetType === 'combo') {
    const slot = data;
    if (slot === 1 && state.combination[1].length > 0) {
      state.combination[1] = [];
    }
    state.combination[slot].push({
      source: state.selectedCard.source,
      index: state.selectedCard.index,
      card: state.selectedCard.source === 'hand' ? state.hands[0][state.selectedCard.index] : state.board[state.selectedCard.index]
    });
  } else if (targetType === 'board' && state.selectedCard.source === 'hand') {
    const handCard = state.hands[0][state.selectedCard.data];
    state.board.push(handCard);
    state.hands[0] = state.hands[0].filter((_, i) => i !== state.selectedCard.data);
    state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
    state.currentPlayer = 1;
    checkGameEnd();
    render();
    if (state.currentPlayer !== 0) {
      setTimeout(async () => await scheduleNextBotTurn(), 100);
    }
  } else if (targetType === state.selectedCard.source && data === state.selectedCard.data) {
    // Return to original position
  }

  state.selectedCard.element.classList.remove('selected');
  state.selectedCard.element.style.transform = 'scale(1)';
  state.selectedCard = null;
  render();
}

function handleDropOriginal(e, source, index) {
  e.preventDefault();
  if (state.currentPlayer !== 0 || !state.draggedCard) return;

  if (state.draggedCard.slot !== undefined) {
    const originalSlot = state.draggedCard.slot;
    state.combination[originalSlot] = state.combination[originalSlot].filter((_, i) => i !== state.draggedCard.comboIndex);
    const originalSource = state.draggedCard.source;
    const originalIndex = state.draggedCard.index;
    if (originalSource === 'hand' && state.hands[0][originalIndex]) {
      state.hands[0][originalIndex] = state.draggedCard.card;
    } else if (originalSource === 'board' && state.board[originalIndex]) {
      state.board[originalIndex] = state.draggedCard.card;
    }
    state.draggedCard = null;
    render();
  }
}

function renderBoard() {
  const boardEl = document.getElementById('board');
  if (boardEl) {
    boardEl.innerHTML = '';
    
    if (state.board && Array.isArray(state.board)) {
      state.board.forEach((card, index) => {
        const isInPlayArea = 
          state.combination.base.some(entry => entry.source === 'board' && entry.index === index) ||
          state.combination.sum1.some(entry => entry.source === 'board' && entry.index === index) ||
          state.combination.sum2.some(entry => entry.source === 'board' && entry.index === index) ||
          state.combination.sum3.some(entry => entry.source === 'board' && entry.index === index) ||
          state.combination.match.some(entry => entry.source === 'board' && entry.index === index);
          
        if (isInPlayArea) return;

        const cardEl = document.createElement('div');
        cardEl.className = `card ${card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : ''}`;
        cardEl.textContent = `${card.value}${suitSymbols[card.suit]}`;
        cardEl.setAttribute('draggable', 'true');
        cardEl.setAttribute('data-index', index);
        cardEl.setAttribute('data-type', 'board');
        cardEl.addEventListener('dragstart', (e) => handleDragStart(e, 'board', index));
        cardEl.addEventListener('dragend', handleDragEnd);
        cardEl.addEventListener('dragover', (e) => e.preventDefault());
        cardEl.addEventListener('drop', (e) => handleDropOriginal(e, 'board', index));
        cardEl.addEventListener('touchstart', (e) => handleTouchStart(e, 'board', index));
        cardEl.addEventListener('touchend', handleTouchEnd);
        boardEl.appendChild(cardEl);
      });
    }

    boardEl.addEventListener('dragover', (e) => e.preventDefault());
    boardEl.addEventListener('drop', handleBoardDrop);
    boardEl.addEventListener('touchend', (e) => handleTouchDrop(e, 'board'));
  }
}

function renderHands() {
  const handEl = document.getElementById('player-hand');
  if (handEl) {
    handEl.innerHTML = '';
    
    for (let index = 0; index < 4; index++) {
      const card = state.hands[0] && state.hands[0][index] ? state.hands[0][index] : null;
      const cardEl = document.createElement('div');
      
      const isInPlayArea = !card || !card.value || !card.suit || 
        state.combination.base.some(entry => entry.source === 'hand' && entry.index === index) ||
        state.combination.sum1.some(entry => entry.source === 'hand' && entry.index === index) ||
        state.combination.sum2.some(entry => entry.source === 'hand' && entry.index === index) ||
        state.combination.sum3.some(entry => entry.source === 'hand' && entry.index === index) ||
        state.combination.match.some(entry => entry.source === 'hand' && entry.index === index);

      if (isInPlayArea) {
        cardEl.className = 'card';
        cardEl.style.backgroundColor = '#f0f0f0';
        cardEl.style.border = '2px dashed #ccc';
        cardEl.textContent = '';
        cardEl.setAttribute('data-index', index);
        cardEl.setAttribute('data-type', 'hand');
        cardEl.addEventListener('dragover', (e) => e.preventDefault());
        cardEl.addEventListener('drop', (e) => handleDropOriginal(e, 'hand', index));
        cardEl.addEventListener('touchend', (e) => handleTouchDrop(e, 'hand', index));
      } else {
        cardEl.className = `card ${card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : ''}`;
        cardEl.textContent = `${card.value}${suitSymbols[card.suit]}`;
        cardEl.setAttribute('draggable', 'true');
        cardEl.setAttribute('data-index', index);
        cardEl.setAttribute('data-type', 'hand');
        cardEl.addEventListener('dragstart', (e) => handleDragStart(e, 'hand', index));
        cardEl.addEventListener('dragend', handleDragEnd);
        cardEl.addEventListener('dragover', (e) => e.preventDefault());
        cardEl.addEventListener('drop', (e) => handleDropOriginal(e, 'hand', index));
        cardEl.addEventListener('touchstart', (e) => handleTouchStart(e, 'hand', index));
        cardEl.addEventListener('touchend', handleTouchEnd);
      }
      handEl.appendChild(cardEl);
    }
  }
}

function renderBotHands() {
  const bot1HandElementEl = document.getElementById('bot1-hand');
  if (bot1HandElementEl) {
    bot1HandElementEl.innerHTML = '';
    if (state.hands[1] && Array.isArray(state.hands[1])) {
      state.hands[1].forEach(() => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card back';
        bot1HandElementEl.appendChild(cardEl);
      });
    }
  }

  const bot2HandElementEl = document.getElementById('bot2-hand');
  if (bot2HandElementEl) {
    bot2HandElementEl.innerHTML = '';
    if (state.hands[2] && Array.isArray(state.hands[2])) {
      state.hands[2].forEach(() => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card back';
        bot2HandElementEl.appendChild(cardEl);
      });
    }
  }
}

function renderScores() {
  const playerScoreEl = document.getElementById('player-score');
  const bot1ScoreEl = document.getElementById('bot1-score');
  const bot2ScoreEl = document.getElementById('bot2-score');
  
  if (playerScoreEl) playerScoreEl.textContent = `Player: ${state.scores.player} pts`;
  if (bot1ScoreEl) bot1ScoreEl.textContent = `Bot 1: ${state.scores.bot1} pts`;
  if (bot2ScoreEl) bot2ScoreEl.textContent = `Bot 2: ${state.scores.bot2} pts`;
}

function updateSubmitButton() {
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

function updateMessage() {
  const messageEl = document.getElementById('message');
  if (messageEl) {
    if (state.currentPlayer === 0) {
      if (state.hands[0].length === 0) {
        messageEl.textContent = "You're out of cards! Bots will finish the round.";
        smartMessages.showMessage("You're out of cards! Bots will finish the round.");
        state.currentPlayer = 1;
        setTimeout(async () => await scheduleNextBotTurn(), 100);
      } else if (state.combination.base.length === 0) {
        messageEl.textContent = "Drag or tap cards to the play areas to capture, or place a card on the board to end your turn.";
        smartMessages.updateMessage('turn_start');
      } else {
        messageEl.textContent = "Click 'Submit Move' to capture, or place a card to end your turn.";
        smartMessages.updateMessage('cards_in_areas');
      }
    } else {
      const botMessage = `Bot ${state.currentPlayer}'s turn...`;
      messageEl.textContent = botMessage;
      smartMessages.showMessage(botMessage);
    }
  }
}

function handleBoardDrop(e) {
  e.preventDefault();
  if (state.currentPlayer !== 0 || !state.draggedCard) return;

  // Case 1: Returning card from combo area to board
  if (state.draggedCard.slot !== undefined) {
    console.log(`🔄 RETURNING CARD: ${state.draggedCard.card.value}${state.draggedCard.card.suit} from ${state.draggedCard.slot} back to board`);
    
    // Remove card from combo area
    state.combination[state.draggedCard.slot] = state.combination[state.draggedCard.slot].filter((_, i) => i !== state.draggedCard.comboIndex);
    
    // FIXED: Don't add to board if it came FROM board originally
    if (state.draggedCard.source === 'board') {
      // Card came from board originally - just put it back at its original index
      // Don't add duplicate to board
      console.log(`🔄 BOARD CARD RETURNED: Not adding duplicate, card stays at original position`);
    } else if (state.draggedCard.source === 'hand') {
      // Card came from hand originally - add it to board (this is a new placement)
      state.board.push(state.draggedCard.card);
      console.log(`🔄 HAND CARD PLACED: Added to board from hand`);
    }
    
    state.draggedCard = null;
    render();
    smartMessages.showSuccessMessage("Card returned!");
    return;
  }

  // Case 2: Placing card from hand to end turn
  if (state.draggedCard.source !== 'hand') return;

  const handCard = state.draggedCard.card;
  const handIndex = state.draggedCard.index;

  state.board.push(handCard);
  state.hands[0] = state.hands[0].filter((_, i) => i !== handIndex);
  state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
  state.currentPlayer = 1;
  state.draggedCard = null;
  checkGameEnd();
  render();
  if (state.currentPlayer !== 0) {
    setTimeout(async () => await scheduleNextBotTurn(), 100);
  }
}

function handleResetPlayArea() {
  if (state.currentPlayer !== 0) return;

  Object.values(state.combination).flat().forEach(entry => {
    if (entry.source === 'hand' && state.hands[0][entry.index]) {
      state.hands[0][entry.index] = entry.card;
    } else if (entry.source === 'board' && state.board[entry.index]) {
      state.board[entry.index] = entry.card;
    }
  });

  state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
  render();
  smartMessages.updateMessage('turn_start');
}

function handleSubmit() {
  if (state.currentPlayer !== 0) return;

  const baseCards = state.combination.base;
  const messageEl = document.getElementById('message');

  if (baseCards.length !== 1) {
    smartMessages.showErrorMessage("Base Card area must have exactly one card!");
    playSound('invalid');
    return;
  }

  const baseCard = baseCards[0];
  const baseValue = parseInt(baseCard.card.value) || (window.valueMap && window.valueMap[baseCard.card.value]) || 1;

  let validCaptures = [];
  let allCapturedCards = [baseCard.card];

  const captureAreas = [
    { name: 'sum1', cards: state.combination.sum1 },
    { name: 'sum2', cards: state.combination.sum2 },
    { name: 'sum3', cards: state.combination.sum3 },
    { name: 'match', cards: state.combination.match }
  ];

  for (const area of captureAreas) {
    if (area.cards.length > 0) {
      const isSum = area.name.startsWith('sum');
      const result = isSum 
        ? validateSumCapture(area.cards, baseValue, baseCard)
        : validateMatchCapture(area.cards, baseValue, baseCard);

      if (result.isValid) {
        validCaptures.push({ name: area.name, cards: area.cards });
        allCapturedCards.push(...area.cards.map(entry => entry.card));
      } else {
        const areaNames = {
          'sum1': 'Sum Area 1',
          'sum2': 'Sum Area 2', 
          'sum3': 'Sum Area 3',
          'match': 'Match Area'
        };
        smartMessages.showErrorMessage(`${areaNames[area.name]}: ${result.details}`);
        playSound('invalid');
        return;
      }
    }
  }

  if (validCaptures.length === 0) {
    smartMessages.showErrorMessage("No valid captures found - check your combinations!");
    playSound('invalid');
    return;
  }

  console.log(`🎯 MULTI-CAPTURE: ${validCaptures.length} areas, ${allCapturedCards.length} cards`);
  executeCapture(baseCard, validCaptures, allCapturedCards);
  state.lastCapturer = 0;
  state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };

  if (state.hands[0].length > 0) {
    state.currentPlayer = 0;
    if (messageEl) messageEl.textContent = "Capture successful! Place a card to end your turn.";
  } else {
    state.currentPlayer = 1;
    if (messageEl) messageEl.textContent = "You're out of cards! Bots will finish the round.";
    setTimeout(async () => await aiTurn(), 1000);
  }
  render();
  playSound('capture');
}

// REPLACE your executeCapture function with this FIXED version:

// REPLACE your executeCapture function with this COMPLETELY FIXED version:

function executeCapture(baseCard, validCaptures, allCapturedCards) {
  console.log(`🎯 EXECUTING CAPTURE - Base: ${baseCard.card.value}${baseCard.card.suit} from ${baseCard.source}[${baseCard.index}]`);
  
  // FIXED: Track which actual cards we're removing by ID, not index
  const cardsToRemove = {
    board: [],
    hand: []
  };
  
  // Collect base card
  if (baseCard.source === 'board') {
    cardsToRemove.board.push(baseCard.card.id);
  } else if (baseCard.source === 'hand') {
    cardsToRemove.hand.push(baseCard.card.id);
  }
  
  // Collect all capture area cards
  validCaptures.forEach(capture => {
    capture.cards.forEach(entry => {
      if (entry.source === 'board') {
        cardsToRemove.board.push(entry.card.id);
      } else if (entry.source === 'hand') {
        cardsToRemove.hand.push(entry.card.id);
      }
    });
  });

  console.log(`🗑️ REMOVING BOARD CARDS:`, cardsToRemove.board);
  console.log(`🗑️ REMOVING HAND CARDS:`, cardsToRemove.hand);

  // FIXED: Remove board cards by ID, not index
  state.board = state.board.filter(card => !cardsToRemove.board.includes(card.id));

  // FIXED: Remove hand cards by ID for current player
  const currentPlayer = state.currentPlayer;
  if (currentPlayer === 0) {
    // Player capture
    state.hands[0] = state.hands[0].filter(card => card && !cardsToRemove.hand.includes(card.id));
  } else {
    // Bot capture - remove from correct bot hand
    state.hands[currentPlayer] = state.hands[currentPlayer].filter(card => card && !cardsToRemove.hand.includes(card.id));
  }

  // Update score for correct player
  const scoreFunction = window.scoreCards || function(cards) { 
    return cards.length * 5;
  };
  const points = scoreFunction(allCapturedCards);

  if (currentPlayer === 0) {
    state.scores.player += points;
    console.log(`🎯 PLAYER SCORED: +${points} pts (Total: ${state.scores.player})`);
    smartMessages.showSuccessMessage(`Captured ${allCapturedCards.length} cards (+${points} pts)!`);
  } else if (currentPlayer === 1) {
    state.scores.bot1 += points;
    console.log(`🎯 BOT 1 SCORED: +${points} pts (Total: ${state.scores.bot1})`);
  } else if (currentPlayer === 2) {
    state.scores.bot2 += points;
    console.log(`🎯 BOT 2 SCORED: +${points} pts (Total: ${state.scores.bot2})`);
  }

  console.log(`✅ CAPTURE COMPLETE: ${allCapturedCards.length} cards, ${points} points`);
}

async function scheduleNextBotTurn() {
  console.log(`⏰ SCHEDULING BOT TURN - CurrentPlayer: ${state.currentPlayer}, InProgress: ${botTurnInProgress}`);
  if (botTurnInProgress) {
    console.log('🚫 BOT TURN ALREADY SCHEDULED - SKIPPING');
    return;
  }
  
  if (state.currentPlayer !== 0 && state.hands[state.currentPlayer] && state.hands[state.currentPlayer].length > 0) {
    botTurnInProgress = true;
    setTimeout(async () => {
      botTurnInProgress = false;
      await aiTurn();
    }, 1000);
  } else if (state.currentPlayer !== 0) {
    console.log(`🚫 BOT ${state.currentPlayer} HAS NO CARDS - FINDING NEXT PLAYER`);
    
    let nextPlayer = (state.currentPlayer + 1) % 3;
    let attempts = 0;
    
    while (attempts < 3) {
      if (nextPlayer === 0 || (state.hands[nextPlayer] && state.hands[nextPlayer].length > 0)) {
        state.currentPlayer = nextPlayer;
        console.log(`🔄 SWITCHED TO PLAYER ${nextPlayer}`);
        if (nextPlayer !== 0) {
          setTimeout(async () => await scheduleNextBotTurn(), 100);
        }
        render();
        return;
      }
      nextPlayer = (nextPlayer + 1) % 3;
      attempts++;
    }
    
    console.log(`🏁 NO PLAYERS WITH CARDS - ENDING GAME`);
    checkGameEnd();
  }
}

async function aiTurn() {
  if (state.currentPlayer === 0) {
    console.error('🚨 CRITICAL: AI called for player turn!');
    return;
  }

  const playerIndex = state.currentPlayer;
  
  if (state.hands[playerIndex].length === 0) {
    state.currentPlayer = (playerIndex + 1) % 3;
    checkGameEnd();
    render();
    if (state.currentPlayer !== 0 && state.hands[state.currentPlayer].length > 0) {
      setTimeout(async () => await scheduleNextBotTurn(), 100);
    }
    return;
  }

  const playersWithCards = state.hands.filter(hand => hand.length > 0).length;
  if (playersWithCards === 1 && state.hands[playerIndex].length > 0) {
    console.log(`🎯 LAST PLAYER: Bot ${playerIndex} must play all ${state.hands[playerIndex].length} cards`);
    
    while (state.hands[playerIndex].length > 0) {
      const handCard = state.hands[playerIndex][0];
      state.board.push(handCard);
      state.hands[playerIndex] = state.hands[playerIndex].filter(card => card.id !== handCard.id);
      console.log(`🎯 FINAL CARD PLACED: Bot ${playerIndex} has ${state.hands[playerIndex].length} cards left`);
      render();
    }
    
    checkGameEnd();
    return;
  }

  console.log(`🤖 BOT ${playerIndex} TURN - Hand: ${state.hands[playerIndex].length} cards`);
  
  setTimeout(() => {
    const move = aiMove(state.hands[playerIndex], state.board, state.settings.botDifficulty);
    console.log(`🤖 BOT ${playerIndex} DIFFICULTY: ${state.settings.botDifficulty}, MOVE: ${move?.action}`);
    
    if (move && move.action === 'capture') {
      console.log(`🤖 BOT ${playerIndex}: Attempting modal capture`);
      const baseCard = move.handCard;
      const handIndex = state.hands[playerIndex].findIndex(c => c.id === baseCard.id);

      if (handIndex !== -1) {
        botModal.botResetModal().then(() => {
          return botModal.botDragCardToSlot(baseCard, 'hand', handIndex, 'base');
        }).then(() => {
          let promise = Promise.resolve();
          for (const targetCard of move.capture.targets) {
            const boardIndex = state.board.findIndex(bc => bc.id === targetCard.id);
            if (boardIndex !== -1) {
              promise = promise.then(() => botModal.botDragCardToSlot(targetCard, 'board', boardIndex, 'sum1'));
            }
          }
          return promise;
        }).then(() => {
          return botModal.botSubmitCapture();
        }).catch(error => {
          console.error('🚨 Bot capture error:', error);
        });
        return;
      }
    } else {
      const handCard = move ? move.handCard : state.hands[playerIndex][0];
      if (handCard) {
        const handIndex = state.hands[playerIndex].findIndex(c => c.id === handCard.id);
        botModal.botPlaceCard(handCard, handIndex);
      }
    }
  }, 1000);
}

/* SECTION: Updated Game End Logic with Scoreboard Modal */
// REPLACE your checkGameEnd function with this FIXED version:
function checkGameEnd() {
  const playersWithCards = state.hands.filter(hand => hand.length > 0).length;
  const messageEl = document.getElementById('message');

  if (playersWithCards === 0) {
    // All players are out of cards
    if (state.deck.length === 0) {
      // Round over - apply Last Combo Takes All rule
      let jackpotMessage = null;
      if (state.lastCapturer !== null && state.board.length > 0) {
        const playerNames = ['Player', 'Bot 1', 'Bot 2'];
        const lastCapturerName = playerNames[state.lastCapturer];
        
        // Last capturer gets all remaining board cards
        const scoreFunction = window.scoreCards || function(cards) { return cards.length * 5; };
        const bonusPoints = scoreFunction(state.board);
        
        if (state.lastCapturer === 0) {
          state.scores.player += bonusPoints;
        } else if (state.lastCapturer === 1) {
          state.scores.bot1 += bonusPoints;
        } else {
          state.scores.bot2 += bonusPoints;
        }
        
        jackpotMessage = `${lastCapturerName} sweeps ${state.board.length} cards! +${bonusPoints} pts`;
        console.log(`🏆 LAST COMBO TAKES ALL: ${jackpotMessage}`);
        playSound('jackpot');
        state.board = []; // Clear the board
      }
      
      // Check if anyone reached target score
      const maxScore = Math.max(state.scores.player, state.scores.bot1, state.scores.bot2);
      if (maxScore >= state.settings.targetScore) {
        const winner = rankPlayers()[0];
        showGameOverModal(jackpotMessage, currentRound); // Use actual round counter
        smartMessages.updateMessage(winner.name === 'Player' ? 'game_over_player' : 'game_over_bot');
        playSound('winner');
      } else {
        // Show round end modal with jackpot (if any)
        if (jackpotMessage) {
          showRoundEndModal(jackpotMessage, currentRound); // Use actual round counter
        } else {
          // Deal new round without modal
          currentRound++; // INCREMENT ROUND COUNTER
          try {
            const newDeck = shuffleDeck(createDeck());
            const dealResult = dealCards(newDeck, 3, 4, 4);
            state.hands = dealResult.players;
            state.board = dealResult.board;
            state.deck = dealResult.remainingDeck;
            state.currentPlayer = 0;
            state.lastCapturer = null;
            smartMessages.updateMessage('turn_start');
            render();
          } catch (e) {
            console.error('Error dealing new round:', e);
            if (messageEl) messageEl.textContent = "Error dealing cards! Restart the game.";
          }
        }
      }
    } else {
      // Deal new round using existing dealCards function (same round continues)
      try {
        const dealResult = dealCards(state.deck, 3, 4, 0);
        state.hands = dealResult.players;
        state.deck = dealResult.remainingDeck;
        state.currentPlayer = 0;
        smartMessages.updateMessage('turn_start');
        render();
      } catch (e) {
        console.error('Error dealing new round:', e);
        if (messageEl) messageEl.textContent = "Error dealing cards! Restart the game.";
      }
    }
  }
}

/* SECTION: Event Listeners and Game Start */
document.addEventListener('DOMContentLoaded', () => {
  // FORCE CLOSE SCOREBOARD MODAL ON PAGE LOAD
  const scoreboardModal = document.getElementById('scoreboard-modal');
  if (scoreboardModal) {
    scoreboardModal.close();
  }
  
  const submitBtn = document.getElementById('submit-btn');
  const restartBtn = document.getElementById('restart-btn');
  const resetBtn = document.getElementById('reset-play-area-btn');
  const hintBtn = document.getElementById('hint-btn');
  
  if (submitBtn) {
    submitBtn.addEventListener('click', handleSubmit);
  }
  
  if (restartBtn) {
    restartBtn.addEventListener('click', initGame);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', handleResetPlayArea);
  }

  if (hintBtn) {
    hintBtn.addEventListener('click', provideHint);
  }
});

initGame();