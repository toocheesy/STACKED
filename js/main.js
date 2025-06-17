/* 
 * Clean main.js - Fixed version without duplicate declarations
 * Updated to work with gameLogic.js global functions
 */
let state = {
  deck: [],
  board: [],
  hands: [[], [], []], // Player, Bot 1, Bot 2
  scores: { player: 0, bot1: 0, bot2: 0 },
  combination: { base: [], sum1: [], sum2: [], sum3: [], match: [] }, // New 5-area structure  
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

// Base64-encoded audio files (shortened for brevity; use real base64 audio in production)
const sounds = {
  capture: new Audio('audio/capture.mp3'),
  place: new Audio('audio/place.mp3'),
  turnChange: new Audio('audio/turnChange.mp3'),
  gameEnd: new Audio('audio/gameEnd.mp3'),
  invalid: new Audio('audio/invalid.mp3'),
  winner: new Audio('audio/winner.mp3'),
  jackpot: new Audio('audio/jackpot.mp3')
};

const suitSymbols = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };

// Initialize the game
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
  render();
  showSettingsModal();
  playSound('turnChange');
}

// Play sound based on settings
function playSound(type) {
  if (state.settings.soundEffects === 'on' && sounds[type]) {
    sounds[type].play().catch(e => console.error('Sound play failed:', e));
  }
}

// Show settings modal
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

// Provide hints by highlighting valid captures
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

// Render the game state
// Updated render function for 5-area layout
function render() {
  const deckCountEl = document.getElementById('deck-count');
  if (deckCountEl) {
    deckCountEl.textContent = `Deck: ${state.deck.length || 0} cards`;
  }

  const tableEl = document.querySelector('.table');
  if (tableEl) {
    const cardCount = state.board ? state.board.length : 0;
    const baseWidth = 800;
    const cardWidth = 80;
    const tableWidth = Math.max(baseWidth, cardCount <= 4 ? baseWidth : (cardCount * cardWidth) + 100);
    tableEl.style.width = `${tableWidth}px`;
    
    const botOffset = -20 - (cardCount > 4 ? (cardCount - 4) * 10 : 0);
    const bot1HandEl = document.querySelector('.bot1-hand');
    const bot2HandEl = document.querySelector('.bot2-hand');
    if (bot1HandEl) bot1HandEl.style.left = `${botOffset}px`;
    if (bot2HandEl) bot2HandEl.style.right = `${botOffset}px`;
  }

  // NEW 5-AREA COMBINATION RENDERING
  const comboAreaEl = document.getElementById('combination-area');
  let captureTypeMessage = "No cards in play areas.";
  
  if (comboAreaEl) {
    const baseEl = comboAreaEl.querySelector('[data-slot="base"]');
    const sum1El = comboAreaEl.querySelector('[data-slot="sum1"]');
    const sum2El = comboAreaEl.querySelector('[data-slot="sum2"]');
    const sum3El = comboAreaEl.querySelector('[data-slot="sum3"]');
    const matchEl = comboAreaEl.querySelector('[data-slot="match"]');
    
    if (baseEl && sum1El && sum2El && sum3El && matchEl) {
      // Render Base Card Area
      renderArea(baseEl, state.combination.base, 'base', 'Base Card');
      
      // Render Sum Areas
      renderArea(sum1El, state.combination.sum1, 'sum1', 'Sum Cards');
      renderArea(sum2El, state.combination.sum2, 'sum2', 'Sum Cards');
      renderArea(sum3El, state.combination.sum3, 'sum3', 'Sum Cards');
      
      // Render Match Area
      renderArea(matchEl, state.combination.match, 'match', 'Matching Cards');

      // VALIDATION LOGIC
      let validCaptures = [];
      let isAnyValid = false;

      if (state.combination.base.length === 1) {
        const baseCard = state.combination.base[0];
        const baseValue = parseInt(baseCard.card.value) || (window.valueMap && window.valueMap[baseCard.card.value]) || 1;

        // Validate Sum1 Area
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

        // Validate Sum2 Area
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

        // Validate Sum3 Area
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

        // Validate Match Area
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
        // Clear all validation states
        [baseEl, sum1El, sum2El, sum3El, matchEl].forEach(el => el.classList.remove('valid-combo'));
        captureTypeMessage = state.combination.base.length === 0 
          ? "Add a Base Card to start building captures."
          : "Invalid: Base Card area must have exactly one card.";
      }

      // Add event listeners to all areas
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

  // Update capture type display
  const captureTypeEl = document.getElementById('capture-type');
  if (captureTypeEl) {
    captureTypeEl.textContent = captureTypeMessage;
  }

  // Render board
  renderBoard();
  
  // Render hands
  renderHands();
  
  // Render bot hands
  renderBotHands();
  
  // Render scores
  renderScores();
  
  // Update submit button
  updateSubmitButton();
  
  // Update message
  updateMessage();
}

// Helper function to render individual areas
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

// Validation functions
function validateSumCapture(sumCards, baseValue, baseCard) {
  const hasHandCard = sumCards.some(entry => entry.source === 'hand') || baseCard.source === 'hand';
  const hasBoardCard = sumCards.some(entry => entry.source === 'board') || baseCard.source === 'board';
  
  if (!hasHandCard || !hasBoardCard) {
    return { isValid: false, details: "Requires hand + board cards" };
  }

  const sumValues = sumCards.map(entry => 
    parseInt(entry.card.value) || (window.valueMap && window.valueMap[entry.card.value]) || 1
  );
  const totalSum = sumValues.reduce((a, b) => a + b, 0);

  if (totalSum === baseValue) {
    return { 
      isValid: true, 
      details: `${sumValues.join(' + ')} = ${baseValue}` 
    };
  }

  return { 
    isValid: false, 
    details: `${sumValues.join(' + ')} = ${totalSum} ≠ ${baseValue}` 
  };
}

function validateMatchCapture(matchCards, baseValue, baseCard) {
  const hasHandCard = matchCards.some(entry => entry.source === 'hand') || baseCard.source === 'hand';
  const hasBoardCard = matchCards.some(entry => entry.source === 'board') || baseCard.source === 'board';
  
  if (!hasHandCard || !hasBoardCard) {
    return { isValid: false, details: "Requires hand + board cards" };
  }

  const allMatch = matchCards.every(entry => entry.card.value === baseCard.card.value);
  
  if (allMatch) {
    return { 
      isValid: true, 
      details: `${matchCards.length + 1} cards matching ${baseCard.card.value}` 
    };
  }

  return { 
    isValid: false, 
    details: "Cards must match Base Card value" 
  };
}

// Handle drag start
function handleDragStart(e, source, index) {
  if (state.currentPlayer !== 0) return;
  state.draggedCard = { source, index, card: source === 'hand' ? state.hands[0][index] : state.board[index] };
  e.target.classList.add('selected');
}

// Handle drag start from combo area
function handleDragStartCombo(e, slot, comboIndex) {
  if (state.currentPlayer !== 0) return;
  state.draggedCard = state.combination[slot][comboIndex];
  state.draggedCard.slot = slot;
  state.draggedCard.comboIndex = comboIndex;
  e.target.classList.add('selected');
}

// Handle drag end
function handleDragEnd(e) {
  e.target.classList.remove('selected');
  state.draggedCard = null;
}

// Handle touch start
function handleTouchStart(e, source, data) {
  if (state.currentPlayer !== 0) return;
  e.preventDefault();
  const target = e.target;
  target.classList.add('selected');
  state.selectedCard = { source, data, element: target };

  target.style.transform = 'scale(1.1)';
  setTimeout(() => {
    if (target.classList.contains('selected')) {
      target.style.transform = 'scale(1)';
    }
  }, 1000);
}

// Handle touch end
function handleTouchEnd(e) {
  if (state.currentPlayer !== 0 || !state.selectedCard) return;
  e.preventDefault();
  state.selectedCard.element.classList.remove('selected');
  state.selectedCard.element.style.transform = 'scale(1)';
  state.selectedCard = null;
}

// Handle drop into combo area
function handleDrop(e, slot) {
  e.preventDefault();
  if (state.currentPlayer !== 0 || !state.draggedCard) return;

  if (state.draggedCard.slot !== undefined) {
    state.combination[state.draggedCard.slot] = state.combination[state.draggedCard.slot].filter((_, i) => i !== state.draggedCard.comboIndex);
  }

  // Limit Principal Match (slot 1) to one card
  if (slot === 1 && state.combination[1].length > 0) {
    state.combination[1] = [];
  }
  state.combination[slot].push({
  source: state.draggedCard.source,
  index: state.draggedCard.index,
  card: state.draggedCard.card
});

console.log(`🔧 CARD DROPPED: ${state.draggedCard.card.value}${state.draggedCard.card.suit} to slot ${slot}`);
console.log(`🔧 COMBINATION STATE:`, state.combination);

state.draggedCard = null;
  render();
  playSound('place');
}

// Handle touch drop
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
      index: state.selectedCard.data,
      card: state.selectedCard.source === 'hand' ? state.hands[0][state.selectedCard.data] : state.board[state.selectedCard.data]
    });
  } else if (targetType === 'board' && state.selectedCard.source === 'hand') {
    const handCard = state.hands[0][state.selectedCard.data];
    state.board.push(handCard);
    state.hands[0] = state.hands[0].filter((_, i) => i !== state.selectedCard.data);
    state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
    state.currentPlayer = 1;
checkGameEnd();
    playSound('place');
    render();
    if (state.currentPlayer !== 0) {
      scheduleNextBotTurn();
    }
  } else if (targetType === state.selectedCard.source && data === state.selectedCard.data) {
    // Return to original position
  }

  state.selectedCard.element.classList.remove('selected');
  state.selectedCard.element.style.transform = 'scale(1)';
  state.selectedCard = null;
  render();
  playSound('place');
}

// Handle drop back to original spot
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

// Helper functions for the new render system

// Render board with 5-area checking
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
    boardEl.addEventListener('drop', handlePlaceDrop);
    boardEl.addEventListener('touchend', (e) => handleTouchDrop(e, 'board'));
  }
}

// Render hands with 5-area checking
function renderHands() {
  const handEl = document.getElementById('player-hand');
  if (handEl) {
    handEl.innerHTML = '';
    
    for (let index = 0; index < 4; index++) {
      const card = state.hands[0] && state.hands[0][index] ? state.hands[0][index] : null;
      const cardEl = document.createElement('div');
      
      // Check if card is in any play area
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

// Render bot hands (unchanged from original)
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

// Render scores (unchanged from original)
function renderScores() {
  const playerScoreEl = document.getElementById('player-score');
  const bot1ScoreEl = document.getElementById('bot1-score');
  const bot2ScoreEl = document.getElementById('bot2-score');
  
  if (playerScoreEl) playerScoreEl.textContent = `Player: ${state.scores.player} pts`;
  if (bot1ScoreEl) bot1ScoreEl.textContent = `Bot 1: ${state.scores.bot1} pts`;
  if (bot2ScoreEl) bot2ScoreEl.textContent = `Bot 2: ${state.scores.bot2} pts`;
}

// Update submit button logic for 5 areas
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

// Update message (unchanged from original)
function updateMessage() {
  const messageEl = document.getElementById('message');
  if (messageEl) {
    if (state.currentPlayer === 0) {
      if (state.hands[0].length === 0) {
        messageEl.textContent = "You're out of cards! Bots will finish the round.";
        state.currentPlayer = 1;
        scheduleNextBotTurn();
      } else if (state.combination.base.length === 0) {
        messageEl.textContent = "Drag or tap cards to the play areas to capture, or place a card on the board to end your turn.";
      } else {
        messageEl.textContent = "Click 'Submit Move' to capture, or place a card to end your turn.";
      }
    } else {
      messageEl.textContent = `Bot ${state.currentPlayer}'s turn...`;
    }
  }
}

// Handle place drop on board
function handlePlaceDrop(e) {
  e.preventDefault();
  if (state.currentPlayer !== 0 || !state.draggedCard || state.draggedCard.source !== 'hand') return;

  const handCard = state.draggedCard.card;
  const handIndex = state.draggedCard.index;

  state.board.push(handCard);
  state.hands[0] = state.hands[0].filter((_, i) => i !== handIndex);
  state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
  state.currentPlayer = 1;
  state.draggedCard = null;
  checkGameEnd();
  render();
  playSound('place');
  if (state.currentPlayer !== 0) {
  scheduleNextBotTurn();
}
}

// Handle reset play area
function handleResetPlayArea() {
  if (state.currentPlayer !== 0) return;

  // Restore cards to original positions from all 5 areas
  Object.values(state.combination).flat().forEach(entry => {
    if (entry.source === 'hand' && state.hands[0][entry.index]) {
      state.hands[0][entry.index] = entry.card;
    } else if (entry.source === 'board' && state.board[entry.index]) {
      state.board[entry.index] = entry.card;
    }
  });

  state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
  render();
}

// Handle submit action
// Updated submit function for multiple captures
function handleSubmit() {
  if (state.currentPlayer !== 0) return;

  const baseCards = state.combination.base;
  const messageEl = document.getElementById('message');

  if (baseCards.length !== 1) {
    if (messageEl) messageEl.textContent = "Invalid: Base Card must have exactly one card.";
    return;
  }

  const baseCard = baseCards[0];
  const baseValue = parseInt(baseCard.card.value) || (window.valueMap && window.valueMap[baseCard.card.value]) || 1;

  let validCaptures = [];
  let allCapturedCards = [baseCard.card];

  // Validate and collect all valid captures
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
        if (messageEl) messageEl.textContent = `Invalid ${area.name}: ${result.details}`;
        return;
      }
    }
  }

  if (validCaptures.length === 0) {
    if (messageEl) messageEl.textContent = "No valid captures found.";
    return;
  }

  console.log(`🎯 MULTI-CAPTURE: ${validCaptures.length} areas, ${allCapturedCards.length} cards`);

  // Execute the capture
  executeCapture(baseCard, validCaptures, allCapturedCards);
  
  // Track last capturer
  state.lastCapturer = 0; // Player is always index 0
  
  // Reset state
  state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };

  if (state.hands[0].length > 0) {
    state.currentPlayer = 0;
    if (messageEl) messageEl.textContent = "Capture successful! Place a card to end your turn.";
  } else {
    state.currentPlayer = 1;
    if (messageEl) messageEl.textContent = "You're out of cards! Bots will finish the round.";
    setTimeout(aiTurn, 1000);
  }
  render();
  playSound('capture');
}

// Helper function to execute capture
function executeCapture(baseCard, validCaptures, allCapturedCards) {
  // Remove captured cards from board
  const boardIndicesToRemove = new Set();
  if (baseCard.source === 'board') {
    boardIndicesToRemove.add(baseCard.index);
  }
  
  validCaptures.forEach(capture => {
    capture.cards.forEach(entry => {
      if (entry.source === 'board') {
        boardIndicesToRemove.add(entry.index);
      }
    });
  });

  state.board = state.board.filter((_, i) => !boardIndicesToRemove.has(i));

  // Remove captured cards from hand
  const handIndicesToRemove = new Set();
  if (baseCard.source === 'hand') {
    handIndicesToRemove.add(baseCard.index);
  }
  
  validCaptures.forEach(capture => {
    capture.cards.forEach(entry => {
      if (entry.source === 'hand') {
        handIndicesToRemove.add(entry.index);
      }
    });
  });

  // Mark hand slots as null, then filter
  Array.from(handIndicesToRemove).forEach(index => {
    if (state.hands[0][index]) {
      state.hands[0][index] = null;
    }
  });
  state.hands[0] = state.hands[0].filter(card => card !== null);

  // Update score
  const scoreFunction = window.scoreCards || function(cards) { 
    return cards.length * 5; // Fallback scoring
  };
  state.scores.player += scoreFunction(allCapturedCards);

  console.log(`🎯 CAPTURED: ${allCapturedCards.length} cards, ${scoreFunction(allCapturedCards)} points`);
}

// Add this helper function to prevent double bot turns
function scheduleNextBotTurn() {
  console.log(`⏰ SCHEDULING BOT TURN - CurrentPlayer: ${state.currentPlayer}, InProgress: ${botTurnInProgress}`);
  if (botTurnInProgress) {
    console.log('🚫 BOT TURN ALREADY SCHEDULED - SKIPPING');
    return;
  }
  
  // Check if current player has cards
  if (state.currentPlayer !== 0 && state.hands[state.currentPlayer] && state.hands[state.currentPlayer].length > 0) {
    botTurnInProgress = true;
    setTimeout(() => {
      botTurnInProgress = false;
      aiTurn();
    }, 1000);
  } else if (state.currentPlayer !== 0) {
    // Current bot has no cards, find next bot with cards or end game
    console.log(`🚫 BOT ${state.currentPlayer} HAS NO CARDS - FINDING NEXT PLAYER`);
    
    let nextPlayer = (state.currentPlayer + 1) % 3;
    let attempts = 0;
    
    while (attempts < 3) {
      if (nextPlayer === 0 || (state.hands[nextPlayer] && state.hands[nextPlayer].length > 0)) {
        state.currentPlayer = nextPlayer;
        console.log(`🔄 SWITCHED TO PLAYER ${nextPlayer}`);
        if (nextPlayer !== 0) {
          scheduleNextBotTurn();
        }
        render();
        return;
      }
      nextPlayer = (nextPlayer + 1) % 3;
      attempts++;
    }
    
    // No players with cards found - end game
    console.log(`🏁 NO PLAYERS WITH CARDS - ENDING GAME`);
    checkGameEnd();
  }
}

function aiTurn() {
  if (state.currentPlayer === 0) {
    console.error('🚨 CRITICAL: AI called for player turn!');
    return;
  }

  const playerIndex = state.currentPlayer;
  
  if (state.hands[playerIndex].length === 0) {
  state.currentPlayer = (playerIndex + 1) % 3;
  checkGameEnd();
  render();
  playSound('turnChange');
  if (state.currentPlayer !== 0 && state.hands[state.currentPlayer].length > 0) {
    scheduleNextBotTurn();
  }
  return;
}

// NEW: Check if this is the only player with cards
const playersWithCards = state.hands.filter(hand => hand.length > 0).length;
if (playersWithCards === 1 && state.hands[playerIndex].length > 0) {
  console.log(`🎯 LAST PLAYER: Bot ${playerIndex} must play all ${state.hands[playerIndex].length} cards`);
  
  // Play all remaining cards immediately
  while (state.hands[playerIndex].length > 0) {
    const handCard = state.hands[playerIndex][0];
    state.board.push(handCard);
    state.hands[playerIndex] = state.hands[playerIndex].filter(card => card.id !== handCard.id);
    console.log(`🎯 FINAL CARD PLACED: Bot ${playerIndex} has ${state.hands[playerIndex].length} cards left`);
    render();
  }
  
  checkGameEnd();
  playSound('place');
  return;
}

  console.log(`🤖 BOT ${playerIndex} TURN - Hand: ${state.hands[playerIndex].length} cards`);
  
  setTimeout(() => {
    const move = aiMove(state.hands[playerIndex], state.board, state.settings.botDifficulty);
console.log(`🤖 BOT ${playerIndex} DIFFICULTY: ${state.settings.botDifficulty}, MOVE: ${move?.action}`);
    
    if (move && move.action === 'capture') {
      // Handle capture
      const handIndex = state.hands[playerIndex].findIndex(c => c.id === move.handCard.id);
      if (handIndex !== -1) {
        state.combination.sum1 = move.capture.targets.map(card => ({
          source: 'board',
          index: state.board.findIndex(bc => bc.id === card.id),
          card
        }));
        state.combination.base = [{ source: 'hand', index: handIndex, card: move.handCard }];
        console.log(`🎯 BOT COMBO: Base=${state.combination.base.length} cards, Sum1=${state.combination.sum1.length} cards`);
        render();
        
        setTimeout(() => {
          const captured = [...state.combination.sum1.map(c => c.card), move.handCard];
          state.board = state.board.filter((_, i) =>
            !state.combination.sum1.some(entry => entry.index === i)
          );
          state.hands[playerIndex] = state.hands[playerIndex].filter(card => card.id !== move.handCard.id);
          state.scores[playerIndex === 1 ? 'bot1' : 'bot2'] += (window.scoreCards || (cards => cards.length * 5))(captured);
          state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
          
          // Track last capturer
          state.lastCapturer = playerIndex;
          
          console.log(`🤖 BOT ${playerIndex} captured - continuing turn`);
render();
playSound('capture');

// Continue playing - check for more captures or place to end turn
setTimeout(() => {
  if (state.hands[playerIndex].length > 0) {
    aiTurn();
  } else {
    // Bot has no cards left after capture - end turn
    console.log(`🤖 BOT ${playerIndex} OUT OF CARDS AFTER CAPTURE`);
    state.currentPlayer = (playerIndex + 1) % 3;
    checkGameEnd();
    render();
    if (state.currentPlayer !== 0 && state.hands[state.currentPlayer].length > 0) {
      scheduleNextBotTurn();
    }
  }
}, 2000);
        }, 1000);
        return;
      }
    }
    
    // Either no capture available or chose to place - end turn
    const handCard = move ? move.handCard : state.hands[playerIndex][0];
    if (handCard) {
      state.board.push(handCard);
      state.hands[playerIndex] = state.hands[playerIndex].filter(card => card.id !== handCard.id);
      state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
      
      state.currentPlayer = (playerIndex + 1) % 3;
      checkGameEnd();
      render();
      playSound('place');
      console.log(`🤖 BOT ${playerIndex} TURN END - placed card`);
      
      if (state.currentPlayer !== 0 && state.hands[state.currentPlayer].length > 0) {
        scheduleNextBotTurn();
      }
    }
  }, 1000);
}


// Check game end - Fixed to use dealCards instead of missing dealAfterBots
function checkGameEnd() {
  const playersWithCards = state.hands.filter(hand => hand.length > 0).length;
  const messageEl = document.getElementById('message');

  if (playersWithCards === 0) {
    // All players are out of cards
    if (state.deck.length === 0) {
  // Round over - apply Last Combo Takes All rule
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
    
    console.log(`🏆 LAST COMBO TAKES ALL: ${lastCapturerName} gets ${state.board.length} cards (+${bonusPoints} pts)`);
    state.board = []; // Clear the board
    
    if (messageEl) messageEl.textContent = `${lastCapturerName} takes remaining ${state.board.length} cards! +${bonusPoints} points`;
  }
  
  // Check if anyone reached target score
  const maxScore = Math.max(state.scores.player, state.scores.bot1, state.scores.bot2);
  if (maxScore >= state.settings.targetScore) {
    const scores = [
      { name: 'Player', score: state.scores.player },
      { name: 'Bot 1', score: state.scores.bot1 },
      { name: 'Bot 2', score: state.scores.bot2 }
    ];
    const winner = scores.reduce((max, player) => 
      player.score > max.score ? player : max, 
      { score: -1, name: '' }
    );
    if (messageEl) messageEl.textContent = `${winner.name} wins the game with ${winner.score} points! Restart to play again.`;
    playSound('gameEnd');
  } else {
    // Deal new round
    try {
      const newDeck = shuffleDeck(createDeck());
      const dealResult = dealCards(newDeck, 3, 4, 4);
      state.hands = dealResult.players;
      state.board = dealResult.board;
      state.deck = dealResult.remainingDeck;
      state.currentPlayer = 0;
      state.lastCapturer = null; // Reset for new round
      if (messageEl) messageEl.textContent = `New round! Scores - Player: ${state.scores.player}, Bot 1: ${state.scores.bot1}, Bot 2: ${state.scores.bot2}`;
      render();
      playSound('turnChange');
    } catch (e) {
      console.error('Error dealing new round:', e);
      if (messageEl) messageEl.textContent = "Error dealing cards! Restart the game.";
    }
  }
} else {
  // Deal new round using existing dealCards function
  try {
    const dealResult = dealCards(state.deck, 3, 4, 0);
    state.hands = dealResult.players;
    state.deck = dealResult.remainingDeck;
    state.currentPlayer = 0;
    if (messageEl) messageEl.textContent = "New round! Drag or tap cards to the play areas to capture.";
    render();
    playSound('turnChange');
  } catch (e) {
    console.error('Error dealing new round:', e);
    if (messageEl) messageEl.textContent = "Error dealing cards! Restart the game.";
  }
}
}
} // <- This closing brace for checkGameEnd function


// Event listeners
document.addEventListener('DOMContentLoaded', () => {
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

// Start the game
initGame();