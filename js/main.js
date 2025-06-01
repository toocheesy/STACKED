let state = {
  deck: [],
  board: [],
  hands: [[], [], []], // Player, Bot 1, Bot 2
  scores: { player: 0, bot1: 0, bot2: 0 },
  combination: [[], [], []], // Array of arrays: each slot can hold multiple cards
  currentPlayer: 0, // 0 = player, 1 = bot1, 2 = bot2
  settings: {
    cardSpeed: 'fast',
    soundEffects: 'off',
    targetScore: 500
  },
  draggedCard: null // Track the dragged card
};

const suitSymbols = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };

// Initialize the game
function initGame() {
  const deck = shuffleDeck(createDeck());
  const { players, board, remainingDeck } = dealCards(deck);
  state.deck = remainingDeck;
  state.board = board.length > 0 ? board : [{ suit: 'Hearts', value: '2', id: '2-Hearts' }];
  state.hands = players.map(hand => hand.length > 0 ? hand : [{ suit: 'Hearts', value: '3', id: '3-Hearts' }]);
  state.scores = { player: 0, bot1: 0, bot2: 0 };
  state.currentPlayer = 0;
  state.combination = [[], [], []];
  state.draggedCard = null;
  render();
  showSettingsModal();
}

// Show settings modal (always show as requested)
function showSettingsModal() {
  const modal = document.getElementById('settings-modal');
  modal.style.display = 'flex';

  document.getElementById('start-game-btn').addEventListener('click', () => {
    state.settings.cardSpeed = document.getElementById('card-speed').value;
    state.settings.soundEffects = document.getElementById('sound-effects').value;
    state.settings.targetScore = parseInt(document.getElementById('target-score').value);
    modal.style.display = 'none';
    render();
  });
}

// Render the game state to the DOM
function render() {
  // Update deck count
  const deckCountEl = document.getElementById('deck-count');
  deckCountEl.textContent = `Deck: ${state.deck.length} cards`;

  // Render combination area - 3 slots
  const comboAreaEl = document.getElementById('combination-area');
  for (let slot = 0; slot < 3; slot++) {
    const slotEl = comboAreaEl.querySelector(`[data-slot="${slot}"]`);
    slotEl.innerHTML = '';
    
    const slotCards = state.combination[slot];
    if (slotCards.length === 0) {
      slotEl.style.backgroundColor = 'rgba(241, 196, 15, 0.1)';
      slotEl.style.border = '2px dashed #ccc';
    } else {
      slotCards.forEach((comboEntry, comboIndex) => {
        const card = comboEntry.card;
        const cardEl = document.createElement('div');
        cardEl.className = `card ${card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : ''}`;
        cardEl.textContent = `${card.value}${suitSymbols[card.suit]}`;
        cardEl.setAttribute('draggable', 'true');
        cardEl.setAttribute('data-slot', slot);
        cardEl.setAttribute('data-combo-index', comboIndex);
        cardEl.addEventListener('dragstart', (e) => handleDragStartCombo(e, slot, comboIndex));
        cardEl.addEventListener('dragend', handleDragEnd);
        slotEl.appendChild(cardEl);
      });
    }
    slotEl.addEventListener('dragover', (e) => e.preventDefault());
    slotEl.addEventListener('drop', (e) => handleDrop(e, slot));
  }

  // Render board - always render 4 slots
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  
  for (let index = 0; index < 4; index++) {
    const card = state.board[index];
    const cardEl = document.createElement('div');
    
    if (!card || !card.value || !card.suit || state.combination.some(slot => slot.some(entry => entry.source === 'board' && entry.index === index))) {
      cardEl.className = 'card';
      cardEl.style.backgroundColor = '#f0f0f0';
      cardEl.style.border = '2px dashed #ccc';
      cardEl.textContent = '';
      cardEl.setAttribute('data-index', index);
      cardEl.setAttribute('data-type', 'board');
      cardEl.addEventListener('dragover', (e) => e.preventDefault());
      cardEl.addEventListener('drop', (e) => handleDropOriginal(e, 'board', index));
    } else {
      cardEl.className = `card ${card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : ''}`;
      cardEl.textContent = `${card.value}${suitSymbols[card.suit]}`;
      cardEl.setAttribute('draggable', 'true');
      cardEl.setAttribute('data-index', index);
      cardEl.setAttribute('data-type', 'board');
      cardEl.addEventListener('dragstart', (e) => handleDragStart(e, 'board', index));
      cardEl.addEventListener('dragend', handleDragEnd);
      cardEl.addEventListener('dragover', (e) => e.preventDefault());
      cardEl.addEventListener('drop', (e) => handleDropOriginal(e, 'board', index));
    }
    boardEl.appendChild(cardEl);
  }

  // Render player's hand - always render 4 slots
  const handEl = document.getElementById('player-hand');
  handEl.innerHTML = '';
  
  for (let index = 0; index < 4; index++) {
    const card = state.hands[0][index];
    const cardEl = document.createElement('div');
    
    if (!card || !card.value || !card.suit || state.combination.some(slot => slot.some(entry => entry.source === 'hand' && entry.index === index))) {
      cardEl.className = 'card';
      cardEl.style.backgroundColor = '#f0f0f0';
      cardEl.style.border = '2px dashed #ccc';
      cardEl.textContent = '';
      cardEl.setAttribute('data-index', index);
      cardEl.setAttribute('data-type', 'hand');
      cardEl.addEventListener('dragover', (e) => e.preventDefault());
      cardEl.addEventListener('drop', (e) => handleDropOriginal(e, 'hand', index));
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
    }
    handEl.appendChild(cardEl);
  }

  // Render Bot 1's hand (card backs)
  const bot1HandEl = document.getElementById('bot1-hand');
  bot1HandEl.innerHTML = '';
  state.hands[1].forEach(() => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card back';
    bot1HandEl.appendChild(cardEl);
  });

  // Render Bot 2's hand (card backs)
  const bot2HandEl = document.getElementById('bot2-hand');
  bot2HandEl.innerHTML = '';
  state.hands[2].forEach(() => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card back';
    bot2HandEl.appendChild(cardEl);
  });

  // Update scores
  document.getElementById('player-score').textContent = `Player: ${state.scores.player} pts`;
  document.getElementById('bot1-score').textContent = `Bot 1: ${state.scores.bot1} pts`;
  document.getElementById('bot2-score').textContent = `Bot 2: ${state.scores.bot2} pts`;

  // Update submit button
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = state.currentPlayer !== 0 || state.combination.every(slot => slot.length === 0);

  // Update message
  const messageEl = document.getElementById('message');
  if (state.currentPlayer === 0) {
    if (state.hands[0].length === 0) {
      messageEl.textContent = "You're out of cards! Waiting for bots to finish the round.";
      state.currentPlayer = 1;
      setTimeout(aiTurn, 1000);
    } else if (state.combination.every(slot => slot.length === 0)) {
      messageEl.textContent = "Drag cards to the playing area to build a capture, or place a card to end your turn.";
    } else {
      messageEl.textContent = "Click 'Submit Move' to confirm your action.";
    }
  } else {
    messageEl.textContent = `Bot ${state.currentPlayer}'s turn...`;
  }
}

// Handle drag start from hand or board
function handleDragStart(e, source, index) {
  if (state.currentPlayer !== 0) return;
  state.draggedCard = { source, index, card: source === 'hand' ? state.hands[0][index] : state.board[index] };
  e.target.classList.add('selected');
}

// Handle drag start from combination area
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

// Handle drop into combination area
function handleDrop(e, slot) {
  e.preventDefault();
  if (state.currentPlayer !== 0 || !state.draggedCard) return;

  // If the card is from the combination area, remove it from its original slot
  if (state.draggedCard.slot !== undefined) {
    state.combination[state.draggedCard.slot] = state.combination[state.draggedCard.slot].filter((_, i) => i !== state.draggedCard.comboIndex);
  }

  // Add the card to the new slot
  state.combination[slot].push({
    source: state.draggedCard.source,
    index: state.draggedCard.index,
    card: state.draggedCard.card
  });

  state.draggedCard = null;
  render();
}

// Handle drop back to original spot (hand or board)
function handleDropOriginal(e, source, index) {
  e.preventDefault();
  if (state.currentPlayer !== 0 || !state.draggedCard) return;

  // Check if the card being dropped is from the combination area
  if (state.draggedCard.slot === undefined) return;

  // Check if the drop target matches the card's original source and index
  if (state.draggedCard.source === source && state.draggedCard.index === index) {
    // Remove the card from the combination area
    state.combination[state.draggedCard.slot] = state.combination[state.draggedCard.slot].filter((_, i) => i !== state.draggedCard.comboIndex);
    state.draggedCard = null;
    render();
  }
}

// Handle submit action (validate and execute moves)
function handleSubmit() {
  if (state.currentPlayer !== 0 || state.combination.every(slot => slot.length === 0)) return;

  // Flatten the combination for validation
  const allCards = state.combination.flat();
  const handCards = allCards.filter(entry => entry.source === 'hand');
  const boardCards = allCards.filter(entry => entry.source === 'board');

  // If exactly one hand card and no board cards, treat as a place action
  if (handCards.length === 1 && boardCards.length === 0) {
    handlePlaceCard(handCards[0]);
    return;
  }

  // Otherwise, attempt a capture (needs at least one hand card and one board card)
  if (handCards.length === 0 || boardCards.length === 0) {
    document.getElementById('message').textContent = 'Invalid move! Include at least one hand card and one board card for captures.';
    return;
  }

  // For captures, use the first hand card (simplification for now)
  const handCard = handCards[0].card;
  const boardIndices = boardCards.map(entry => entry.index);
  const captures = canCapture(handCard, state.board);
  const selectedCapture = captures.find(cap =>
    cap.cards.every(i => boardIndices.includes(i))
  );

  if (!selectedCapture) {
    document.getElementById('message').textContent = 'Invalid capture! Try a different combination.';
    state.combination = [[], [], []];
    render();
    return;
  }

  const capturedCards = [selectedCapture.target];
  state.board = state.board.filter((_, i) => !selectedCapture.cards.includes(i));
  state.hands[0] = state.hands[0].filter((_, i) => !handCards.some(entry => entry.index === i));
  state.scores.player += scoreCards(capturedCards);

  if (state.board.length === 0 && state.hands[0].length > 0) {
    const nextCard = state.hands[0][0];
    if (nextCard && nextCard.value && nextCard.suit) {
      state.board.push(nextCard);
      state.hands[0] = state.hands[0].slice(1);
    }
  }

  state.combination = [[], [], []];
  checkGameEnd();
  render();
  // Do not advance to the next player; allow multiple captures
}

// Handle place card action (ends the turn)
function handlePlaceCard(handEntry) {
  const handCard = handEntry.card;
  const handIndex = handEntry.index;
  
  // Place the card in the first empty slot or append
  let placed = false;
  for (let i = 0; i < 4; i++) {
    if (!state.board[i]) {
      state.board[i] = handCard;
      placed = true;
      break;
    }
  }
  if (!placed) {
    state.board.push(handCard);
  }
  
  state.hands[0] = state.hands[0].filter((_, i) => i !== handIndex);
  state.combination = [[], [], []];
  state.currentPlayer = 1; // End player's turn
  checkGameEnd();
  render();
  if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
}

// AI turn
function aiTurn() {
  const playerIndex = state.currentPlayer;
  if (state.hands[playerIndex].length === 0) {
    // If bot is out of cards, move to the next player
    state.currentPlayer = (playerIndex + 1) % 3;
    checkGameEnd();
    render();
    if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
    return;
  }

  const aiAction = aiMove(state.hands[playerIndex], state.board);

  if (aiAction.action === 'capture') {
    const capturedCards = [aiAction.capture.target];
    state.board = state.board.filter((_, i) => !aiAction.capture.cards.includes(i));
    state.hands[playerIndex] = state.hands[playerIndex].filter(c => c.id !== aiAction.handCard.id);
    state.scores[playerIndex === 1 ? 'bot1' : 'bot2'] += scoreCards(capturedCards);
  } else {
    // Place the card in the first empty slot or append
    let placed = false;
    for (let i = 0; i < 4; i++) {
      if (!state.board[i]) {
        state.board[i] = aiAction.handCard;
        placed = true;
        break;
      }
    }
    if (!placed) {
      state.board.push(aiAction.handCard);
    }
    state.hands[playerIndex] = state.hands[playerIndex].filter(c => c.id !== aiAction.handCard.id);
  }

  if (state.board.length === 0 && state.hands[playerIndex].length > 0) {
    const nextCard = state.hands[playerIndex][0];
    if (nextCard && nextCard.value && nextCard.suit) {
      state.board.push(nextCard);
      state.hands[playerIndex] = state.hands[playerIndex].slice(1);
    }
  }

  state.currentPlayer = (playerIndex + 1) % 3;
  checkGameEnd();
  render();
  if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
}

// Check if the game has ended or a round has ended
function checkGameEnd() {
  const playersWithCards = state.hands.filter(hand => hand.length > 0).length;

  // Check if the round has ended (all players out of cards)
  if (playersWithCards === 0) {
    if (state.deck.length === 0) {
      // Game ends if deck is empty
      const winner = state.scores.player >= state.settings.targetScore ? 'Player' :
                     state.scores.bot1 >= state.settings.targetScore ? 'Bot 1' :
                     state.scores.bot2 >= state.settings.targetScore ? 'Bot 2' :
                     state.scores.player > state.scores.bot1 && state.scores.player > state.scores.bot2 ? 'Player' :
                     state.scores.bot1 > state.scores.player && state.scores.bot1 > state.scores.bot2 ? 'Bot 1' : 'Bot 2';
      document.getElementById('message').textContent = `${winner} wins! Restart the game to play again.`;
    } else {
      // Start a new round: deal 4 cards to each player
      const { players, board, remainingDeck } = dealCards(state.deck, 3, 4, 4);
      state.deck = remainingDeck;
      state.board = board.length > 0 ? board : state.board;
      state.hands = players;
      state.currentPlayer = 0;
      document.getElementById('message').textContent = "New round! Drag cards to the playing area to build a capture.";
    }
  }
}

// Event listeners
document.getElementById('submit-btn').addEventListener('click', handleSubmit);
document.getElementById('restart-btn').addEventListener('click', initGame);

// Start the game
initGame();