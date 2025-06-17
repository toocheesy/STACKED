/* 
 * Enhanced main.js for STACKED! with premium animations
 * Adds smooth card movements, capture effects, UI polish, and game state feedback
 */
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

// Base64-encoded audio files (placeholder)
const sounds = {
  capture: new Audio('data:audio/mp3;base64,...'),
  place: new Audio('data:audio/mp3;base64,...'),
  turnChange: new Audio('data:audio/mp3;base64,...'),
  gameEnd: new Audio('data:audio/mp3;base64,...')
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
  renderWithDealAnimation();
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
        renderWithDealAnimation();
      });
    }

    if (tutorialBtn) {
      tutorialBtn.addEventListener('click', () => {
        tutorialModal.showModal();
      });
    }
  }
}

// Provide hints with animated highlights
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
    if (messageEl) {
      messageEl.textContent = "No valid captures available. Place a card to end your turn.";
      messageEl.classList.add('turn-change');
      setTimeout(() => messageEl.classList.remove('turn-change'), 500);
    }
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
    if (messageEl) {
      messageEl.textContent = "Hint: Try combining the highlighted cards!";
      messageEl.classList.add('turn-change');
      setTimeout(() => messageEl.classList.remove('turn-change'), 500);
    }
  }, 3000);
}

// Render with deal animation
function renderWithDealAnimation() {
  render();
  // Add deal animation to newly dealt cards
  const cards = document.querySelectorAll('#player-hand .card, #board .card');
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('dealing');
      setTimeout(() => card.classList.remove('dealing'), 500);
    }, index * 100);
  });

  const deckCountEl = document.getElementById('deck-count');
  if (deckCountEl) {
    deckCountEl.classList.add('dealing');
    setTimeout(() => deckCountEl.classList.remove('dealing'), 500);
  }
}

// Render the game state
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

  // Render combination areas
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
        el.addEventListener('dragover', (e) => {
          e.preventDefault();
          if (state.currentPlayer === 0) {
            el.classList.add('valid-target');
          }
        });
        el.addEventListener('dragleave', () => el.classList.remove('valid-target'));
        el.addEventListener('drop', (e) => {
          el.classList.remove('valid-target');
          handleDrop(e, slot);
        });
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
  updateTurnIndicator();
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
      // Add snap animation for newly placed cards
      if (comboEntry.justPlaced) {
        cardEl.classList.add('snapped');
        setTimeout(() => {
          cardEl.classList.remove('snapped');
          comboEntry.justPlaced = false;
        }, 300);
      }
    });
    areaEl.style.height = `${110 + (cards.length - 1) * 20}px`;
    areaEl.style.backgroundColor = '';
    areaEl.style.border = '';
    areaEl.textContent = '';
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
    return { isValid: true, details: `${sumValues.join(' + ')} = ${baseValue}` };
  }

  return { isValid: false, details: `${sumValues.join(' + ')} = ${totalSum} ≠ ${baseValue}` };
}

function validateMatchCapture(matchCards, baseValue, baseCard) {
  const hasHandCard = matchCards.some(entry => entry.source === 'hand') || baseCard.source === 'hand';
  const hasBoardCard = matchCards.some(entry => entry.source === 'board') || baseCard.source === 'board';
  
  if (!hasHandCard || !hasBoardCard) {
    return { isValid: false, details: "Requires hand + board cards" };
  }

  const allMatch = matchCards.every(entry => entry.card.value === baseCard.card.value);
  
  if (allMatch) {
    return { isValid: true, details: `${matchCards.length + 1} cards matching ${baseCard.card.value}` };
  }

  return { isValid: false, details: "Cards must match Base Card value" };
}

// Handle drag start
function handleDragStart(e, source, index) {
  if (state.currentPlayer !== 0) return;
  state.draggedCard = { source, index, card: source === 'hand' ? state.hands[0][index] : state.board[index] };
  e.target.classList.add('dragging', 'selected');
}

// Handle drag start from combo area
function handleDragStartCombo(e, slot, comboIndex) {
  if (state.currentPlayer !== 0) return;
  state.draggedCard = state.combination[slot][comboIndex];
  state.draggedCard.slot = slot;
  state.draggedCard.comboIndex = comboIndex;
  e.target.classList.add('dragging', 'selected');
}

// Handle drag end
function handleDragEnd(e) {
  e.target.classList.remove('dragging', 'selected');
  state.draggedCard = null;
  document.querySelectorAll('.valid-target').forEach(el => el.classList.remove('valid-target'));
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

  let isValidDrop = true;
  if (slot === 'base' && state.combination.base.length > 0) {
    isValidDrop = false;
  }

  if (isValidDrop) {
    if (state.draggedCard.slot !== undefined) {
      state.combination[state.draggedCard.slot] = state.combination[state.draggedCard.slot].filter((_, i) => i !== state.draggedCard.comboIndex);
    }

    state.combination[slot].push({
      source: state.draggedCard.source,
      index: state.draggedCard.index,
      card: state.draggedCard.card,
      justPlaced: true
    });

    console.log(`🔧 CARD DROPPED: ${state.draggedCard.card.value}${state.draggedCard.card.suit} to slot ${slot}`);
    playSound('place');
  } else {
    const comboSlot = document.querySelector(`.combo-slot[data-slot="${slot}"]`);
    if (comboSlot) {
      comboSlot.classList.add('invalid');
      setTimeout(() => comboSlot.classList.remove('invalid'), 300);
    }
  }

  state.draggedCard = null;
  render();
}

// Handle touch drop
function handleTouchDrop(e, targetType, data) {
  e.preventDefault();
  if (state.currentPlayer !== 0 || !state.selectedCard) return;

  if (targetType === 'combo') {
    const slot = data;
    if (slot === 'base' && state.combination.base.length > 0) {
      const baseSlot = document.querySelector('.combo-slot[data-slot="base"]');
      if (baseSlot) {
        baseSlot.classList.add('invalid');
        setTimeout(() => baseSlot.classList.remove('invalid'), 300);
      }
    } else {
      state.combination[slot].push({
        source: state.selectedCard.source,
        index: state.selectedCard.data,
        card: state.selectedCard.source === 'hand' ? state.hands[0][state.selectedCard.data] : state.board[state.selectedCard.data],
        justPlaced: true
      });
      playSound('place');
    }
  } else if (targetType === 'board' && state.selectedCard.source === 'hand') {
    const handCard = state.hands[0][state.selectedCard.data];
    state.board.push(handCard);
    state.hands[0] = state.hands[0].filter((_, i) => i !== state.selectedCard.data);
    state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
    state.currentPlayer = 1;
    checkGameEnd();
    render();
    playSound('place');
    if (state.currentPlayer !== 0) {
      scheduleNextBotTurn();
    }
  } else if (targetType === state.selectedCard.source && data === state.selectedCard.data) {
    state.selectedCard.element.classList.add('invalid');
    setTimeout(() => state.selectedCard.element.classList.remove('invalid'), 400);
  }

  state.selectedCard.element.classList.remove('selected');
  state.selectedCard.element.style.transform = 'scale(1)';
  state.selectedCard = null;
  render();
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

// Render board
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

// Render hands
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

// Render bot hands
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

// Render scores with animation
function renderScores() {
  const playerScoreEl = document.getElementById('player-score');
  const bot1ScoreEl = document.getElementById('bot1-score');
  const bot2ScoreEl = document.getElementById('bot2-score');
  
  if (playerScoreEl) {
    const oldScore = parseInt(playerScoreEl.textContent.match(/\d+/)?.[0]) || 0;
    if (oldScore !== state.scores.player) {
      playerScoreEl.classList.add('updated');
      setTimeout(() => playerScoreEl.classList.remove('updated'), 500);
    }
    playerScoreEl.textContent = `Player: ${state.scores.player} pts`;
  }
  if (bot1ScoreEl) {
    const oldScore = parseInt(bot1ScoreEl.textContent.match(/\d+/)?.[0]) || 0;
    if (oldScore !== state.scores.bot1) {
      bot1ScoreEl.classList.add('updated');
      setTimeout(() => bot1ScoreEl.classList.remove('updated'), 500);
    }
    bot1ScoreEl.textContent = `Bot 1: ${state.scores.bot1} pts`;
  }
  if (bot2ScoreEl) {
    const oldScore = parseInt(bot2ScoreEl.textContent.match(/\d+/)?.[0]) || 0;
    if (oldScore !== state.scores.bot2) {
      bot2ScoreEl.classList.add('updated');
      setTimeout(() => bot2ScoreEl.classList.remove('updated'), 500);
    }
    bot2ScoreEl.textContent = `Bot 2: ${state.scores.bot2} pts`;
  }
}

// Update submit button
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

// Update message with animation
function updateMessage() {
  const messageEl = document.getElementById('message');
  if (messageEl) {
    const oldMessage = messageEl.textContent;
    let newMessage;
    if (state.currentPlayer === 0) {
      if (state.hands[0].length === 0) {
        newMessage = "You're out of cards! Bots will finish the round.";
        state.currentPlayer = 1;
        scheduleNextBotTurn();
      } else if (state.combination.base.length === 0) {
        newMessage = "Drag or tap cards to the play areas to capture, or place a card on the board to end your turn.";
      } else {
        newMessage = "Click 'Submit Move' to capture, or place a card to end your turn.";
      }
    } else {
      newMessage = `Bot ${state.currentPlayer}'s turn...`;
    }
    
    if (oldMessage !== newMessage) {
      messageEl.classList.add('turn-change');
      messageEl.textContent = newMessage;
      setTimeout(() => messageEl.classList.remove('turn-change'), 500);
    }
  }
}

// Update turn indicator
function updateTurnIndicator() {
  let indicator = document.querySelector('.turn-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'turn-indicator';
    document.querySelector('.game-container').appendChild(indicator);
  }
  
  const playerNames = ['Player', 'Bot 1', 'Bot 2'];
  indicator.textContent = `${playerNames[state.currentPlayer]}'s Turn`;
}

// Create particle effects for last combo
function createParticleEffect(x, y) {
  const numParticles = 20;
  for (let i = 0; i < numParticles; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    const angle = Math.random() * 360;
    const distance = Math.random() * 50 + 20;
    particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
    document.querySelector('.game-container').appendChild(particle);
    setTimeout(() => particle.remove(), 500);
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

// Handle submit with multi-capture animation
function handleSubmit() {
  if (state.currentPlayer !== 0) return;

  const baseCards = state.combination.base;
  const messageEl = document.getElementById('message');

  if (baseCards.length !== 1) {
    if (messageEl) {
      messageEl.textContent = "Invalid: Base Card must have exactly one card.";
      messageEl.classList.add('turn-change');
      setTimeout(() => messageEl.classList.remove('turn-change'), 500);
    }
    const baseSlot = document.querySelector('.combo-slot[data-slot="base"]');
    if (baseSlot) {
      baseSlot.classList.add('invalid');
      setTimeout(() => baseSlot.classList.remove('invalid'), 300);
    }
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
        if (messageEl) {
          messageEl.textContent = `Invalid ${area.name}: ${result.details}`;
          messageEl.classList.add('turn-change');
          setTimeout(() => messageEl.classList.remove('turn-change'), 500);
        }
        const slot = document.querySelector(`.combo-slot[data-slot="${area.name}"]`);
        if (slot) {
          slot.classList.add('invalid');
          setTimeout(() => slot.classList.remove('invalid'), 300);
        }
        return;
      }
    }
  }

  if (validCaptures.length === 0) {
    if (messageEl) {
      messageEl.textContent = "No valid captures found.";
      messageEl.classList.add('turn-change');
      setTimeout(() => messageEl.classList.remove('turn-change'), 500);
    }
    return;
  }

  console.log(`🎯 MULTI-CAPTURE: ${validCaptures.length} areas, ${allCapturedCards.length} cards`);

  // Animate multi-capture
  animateMultiCapture(baseCard, validCaptures, allCapturedCards, () => {
    executeCapture(baseCard, validCaptures, allCapturedCards);
    state.lastCapturer = 0;
    state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };

    if (state.hands[0].length > 0) {
      state.currentPlayer = 0;
      if (messageEl) {
        messageEl.textContent = "Capture successful! Place a card to end your turn.";
        messageEl.classList.add('turn-change');
        setTimeout(() => messageEl.classList.remove('turn-change'), 500);
      }
    } else {
      state.currentPlayer = 1;
      if (messageEl) {
        messageEl.textContent = "You're out of cards! Bots will finish the round.";
        messageEl.classList.add('turn-change');
        setTimeout(() => messageEl.classList.remove('turn-change'), 500);
      }
      setTimeout(aiTurn, 1000);
    }
    render();
    playSound('capture');
  });
}

// Animate multi-capture
function animateMultiCapture(baseCard, validCaptures, allCapturedCards, callback) {
  const slots = ['base', 'sum1', 'sum2', 'sum3', 'match'];
  let delay = 0;

  slots.forEach(slot => {
    const slotEl = document.querySelector(`.combo-slot[data-slot="${slot}"]`);
    const cardsInSlot = slot === 'base' ? [baseCard] : validCaptures.find(c => c.name === slot)?.cards || [];
    
    cardsInSlot.forEach((entry, index) => {
      const cardEl = slotEl.querySelector(`.card[data-combo-index="${index}"]`);
      if (cardEl) {
        setTimeout(() => {
          cardEl.classList.add('captured');
          createParticleEffect(cardEl.getBoundingClientRect().left + 35, cardEl.getBoundingClientRect().top + 50);
        }, delay);
        delay += 200;
      }
    });
  });

  setTimeout(callback, delay + 600);
}

// Execute capture
function executeCapture(baseCard, validCaptures, allCapturedCards) {
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

  Array.from(handIndicesToRemove).forEach(index => {
    if (state.hands[0][index]) {
      state.hands[0][index] = null;
    }
  });
  state.hands[0] = state.hands[0].filter(card => card !== null);

  const scoreFunction = window.scoreCards || function(cards) { 
    return cards.length * 5;
  };
  state.scores.player += scoreFunction(allCapturedCards);

  console.log(`🎯 CAPTURED: ${allCapturedCards.length} cards, ${scoreFunction(allCapturedCards)} points`);
}

// Schedule bot turn
function scheduleNextBotTurn() {
  console.log(`⏰ SCHEDULING BOT TURN - CurrentPlayer: ${state.currentPlayer}, InProgress: ${botTurnInProgress}`);
  if (botTurnInProgress) {
    console.log('🚫 BOT TURN ALREADY SCHEDULED - SKIPPING');
    return;
  }
  
  if (state.currentPlayer !== 0 && state.hands[state.currentPlayer] && state.hands[state.currentPlayer].length > 0) {
    botTurnInProgress = true;
    setTimeout(() => {
      botTurnInProgress = false;
      aiTurn();
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
          scheduleNextBotTurn();
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

// AI turn with animations
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
    playSound('place');
    return;
  }

  console.log(`🤖 BOT ${playerIndex} TURN - Hand: ${state.hands[playerIndex].length} cards`);
  
  setTimeout(() => {
    const move = aiMove(state.hands[playerIndex], state.board, state.settings.botDifficulty);
    console.log(`🤖 BOT ${playerIndex} DIFFICULTY: ${state.settings.botDifficulty}, MOVE: ${move?.action}`);
    
    if (move && move.action === 'capture') {
      const handIndex = state.hands[playerIndex].findIndex(c => c.id === move.handCard.id);
      if (handIndex !== -1) {
        state.combination.sum1 = move.capture.targets.map(card => ({
          source: 'board',
          index: state.board.findIndex(bc => bc.id === card.id),
          card,
          justPlaced: true
        }));
        state.combination.base = [{ source: 'hand', index: handIndex, card: move.handCard, justPlaced: true }];
        console.log(`🎯 BOT COMBO: Base=${state.combination.base.length} cards, Sum1=${state.combination.sum1.length} cards`);
        render();
        
        setTimeout(() => {
          const captured = [...state.combination.sum1.map(c => c.card), move.handCard];
          animateMultiCapture(
            state.combination.base[0],
            [{ name: 'sum1', cards: state.combination.sum1 }],
            captured,
            () => {
              state.board = state.board.filter((_, i) =>
                !state.combination.sum1.some(entry => entry.index === i)
              );
              state.hands[playerIndex] = state.hands[playerIndex].filter(card => card.id !== move.handCard.id);
              state.scores[playerIndex === 1 ? 'bot1' : 'bot2'] += (window.scoreCards || (cards => cards.length * 5))(captured);
              state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
              
              state.lastCapturer = playerIndex;
              
              console.log(`🤖 BOT ${playerIndex} captured - continuing turn`);
              render();
              playSound('capture');

              setTimeout(() => {
                if (state.hands[playerIndex].length > 0) {
                  aiTurn();
                } else {
                  console.log(`🤖 BOT ${playerIndex} OUT OF CARDS AFTER CAPTURE`);
                  state.currentPlayer = (playerIndex + 1) % 3;
                  checkGameEnd();
                  render();
                  if (state.currentPlayer !== 0 && state.hands[state.currentPlayer].length > 0) {
                    scheduleNextBotTurn();
                  }
                }
              }, 1000);
            }
          );
        }, 1000);
        return;
      }
    }
    
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

// Check game end with last combo animation
function checkGameEnd() {
  const playersWithCards = state.hands.filter(hand => hand.length > 0).length;
  const messageEl = document.getElementById('message');

  if (playersWithCards === 0) {
    if (state.deck.length === 0) {
      if (state.lastCapturer !== null && state.board.length > 0) {
        const playerNames = ['Player', 'Bot 1', 'Bot 2'];
        const lastCapturerName = playerNames[state.lastCapturer];
        
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
        
        // Animate last combo
        const tableEl = document.querySelector('.table');
        if (tableEl) {
          tableEl.classList.add('last-combo');
          setTimeout(() => tableEl.classList.remove('last-combo'), 1000);
        }
        
        state.board.forEach((_, index) => {
          const cardEl = document.querySelector(`#board .card[data-index="${index}"]`);
          if (cardEl) {
            setTimeout(() => {
              cardEl.classList.add('captured');
              createParticleEffect(cardEl.getBoundingClientRect().left + 35, cardEl.getBoundingClientRect().top + 50);
            }, index * 100);
          }
        });
        
        setTimeout(() => {
          state.board = [];
          if (messageEl) {
            messageEl.textContent = `${lastCapturerName} takes remaining ${state.board.length} cards! +${bonusPoints} points`;
            messageEl.classList.add('turn-change');
            setTimeout(() => messageEl.classList.remove('turn-change'), 500);
          }
          
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
            if (messageEl) {
              messageEl.textContent = `${winner.name} wins the game with ${winner.score} points! Restart to play again.`;
              messageEl.classList.add('turn-change');
              setTimeout(() => messageEl.classList.remove('turn-change'), 500);
            }
            playSound('gameEnd');
          } else {
            try {
              const newDeck = shuffleDeck(createDeck());
              const dealResult = dealCards(newDeck, 3, 4, 4);
              state.hands = dealResult.players;
              state.board = dealResult.board;
              state.deck = dealResult.remainingDeck;
              state.currentPlayer = 0;
              state.lastCapturer = null;
              if (messageEl) {
                messageEl.textContent = `New round! Scores - Player: ${state.scores.player}, Bot 1: ${state.scores.bot1}, Bot 2: ${state.scores.bot2}`;
                messageEl.classList.add('turn-change');
                setTimeout(() => messageEl.classList.remove('turn-change'), 500);
              }
              renderWithDealAnimation();
              playSound('turnChange');
            } catch (e) {
              console.error('Error dealing new round:', e);
              if (messageEl) {
                messageEl.textContent = "Error dealing cards! Restart the game.";
                messageEl.classList.add('turn-change');
                setTimeout(() => messageEl.classList.remove('turn-change'), 500);
              }
            }
          }
        }, state.board.length * 100 + 600);
      } else {
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
          if (messageEl) {
            messageEl.textContent = `${winner.name} wins the game with ${winner.score} points! Restart to play again.`;
            messageEl.classList.add('turn-change');
            setTimeout(() => messageEl.classList.remove('turn-change'), 500);
          }
          playSound('gameEnd');
        } else {
          try {
            const newDeck = shuffleDeck(createDeck());
            const dealResult = dealCards(newDeck, 3, 4, 4);
            state.hands = dealResult.players;
            state.board = dealResult.board;
            state.deck = dealResult.remainingDeck;
            state.currentPlayer = 0;
            state.lastCapturer = null;
            if (messageEl) {
              messageEl.textContent = `New round! Scores - Player: ${state.scores.player}, Bot 1: ${state.scores.bot1}, Bot 2: ${state.scores.bot2}`;
              messageEl.classList.add('turn-change');
              setTimeout(() => messageEl.classList.remove('turn-change'), 500);
            }
            renderWithDealAnimation();
            playSound('turnChange');
          } catch (e) {
            console.error('Error dealing new round:', e);
            if (messageEl) {
              messageEl.textContent = "Error dealing cards! Restart the game.";
              messageEl.classList.add('turn-change');
              setTimeout(() => messageEl.classList.remove('turn-change'), 500);
            }
          }
        }
      }
    } else {
      try {
        const dealResult = dealCards(state.deck, 3, 4, 0);
        state.hands = dealResult.players;
        state.deck = dealResult.remainingDeck;
        state.currentPlayer = 0;
        if (messageEl) {
          messageEl.textContent = "New round! Drag or tap cards to the play areas to capture.";
          messageEl.classList.add('turn-change');
          setTimeout(() => messageEl.classList.remove('turn-change'), 500);
        }
        renderWithDealAnimation();
        playSound('turnChange');
      } catch (e) {
        console.error('Error dealing new round:', e);
        if (messageEl) {
          messageEl.textContent = "Error dealing cards! Restart the game.";
          messageEl.classList.add('turn-change');
          setTimeout(() => messageEl.classList.remove('turn-change'), 500);
        }
      }
    }
  }
}

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