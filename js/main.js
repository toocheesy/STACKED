let state = {
  deck: [],
  board: [],
  hands: [[], [], []], // Player, Bot 1, Bot 2
  scores: { player: 0, bot1: 0, bot2: 0 },
  draggedCardIndex: null, // Track the dragged hand card
  selectedBoardCards: [], // Track selected board cards for capture
  currentPlayer: 0, // 0 = player, 1 = bot1, 2 = bot2
  settings: {
    cardSpeed: 'fast',
    soundEffects: 'off'
  }
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
  state.draggedCardIndex = null;
  state.selectedBoardCards = [];
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
    modal.style.display = 'none';
  });

  document.getElementById('skip-settings-btn').addEventListener('click', () => {
    modal.style.display = 'none';
  });
}

// Render the game state to the DOM
function render() {
  // Update deck count
  const deckCountEl = document.getElementById('deck-count');
  deckCountEl.textContent = `Deck: ${state.deck.length} cards`;

  // Render board - always render 4 slots
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  
  for (let index = 0; index < 4; index++) {
    const card = state.board[index];
    const cardEl = document.createElement('div');
    
    if (!card || !card.value || !card.suit) {
      cardEl.className = 'card';
      cardEl.style.backgroundColor = '#f0f0f0';
      cardEl.style.border = '2px dashed #ccc';
      cardEl.textContent = '';
      cardEl.setAttribute('data-index', index);
      cardEl.setAttribute('data-type', 'board');
      cardEl.addEventListener('dragover', (e) => e.preventDefault());
      cardEl.addEventListener('drop', handleDrop);
    } else {
      cardEl.className = `card ${card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : ''} ${
        state.selectedBoardCards.includes(index) ? 'selected' : ''
      }`;
      cardEl.textContent = `${card.value}${suitSymbols[card.suit]}`;
      cardEl.setAttribute('data-index', index);
      cardEl.setAttribute('data-type', 'board');
      cardEl.addEventListener('dragover', (e) => e.preventDefault());
      cardEl.addEventListener('drop', handleDrop);
    }
    boardEl.appendChild(cardEl);
  }

  // Render player's hand - always render 4 slots
  const handEl = document.getElementById('player-hand');
  handEl.innerHTML = '';
  
  for (let index = 0; index < 4; index++) {
    const card = state.hands[0][index];
    const cardEl = document.createElement('div');
    
    if (!card || !card.value || !card.suit) {
      cardEl.className = 'card';
      cardEl.style.backgroundColor = '#f0f0f0';
      cardEl.style.border = '2px dashed #ccc';
      cardEl.textContent = '';
    } else {
      cardEl.className = `card ${card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : ''} ${
        state.draggedCardIndex === index ? 'selected' : ''
      }`;
      cardEl.textContent = `${card.value}${suitSymbols[card.suit]}`;
      cardEl.setAttribute('draggable', 'true');
      cardEl.setAttribute('data-index', index);
      cardEl.setAttribute('data-type', 'hand');
      cardEl.addEventListener('dragstart', handleDragStart);
      cardEl.addEventListener('dragend', handleDragEnd);
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
  submitBtn.disabled = state.currentPlayer !== 0 || state.draggedCardIndex === null || state.selectedBoardCards.length === 0;

  // Update message
  const messageEl = document.getElementById('message');
  if (state.currentPlayer === 0) {
    if (state.hands[0].length === 0) {
      messageEl.textContent = "You're out of cards! Waiting for bots to finish the round.";
      state.currentPlayer = 1;
      setTimeout(aiTurn, 1000);
    } else if (state.draggedCardIndex === null) {
      messageEl.textContent = "Drag a card from your hand to the board to capture or place.";
    } else if (state.selectedBoardCards.length === 0) {
      messageEl.textContent = "Drag your card to board cards to capture, or an empty slot to place.";
    } else {
      messageEl.textContent = "Click 'Submit Move' to confirm your action.";
    }
  } else {
    messageEl.textContent = `Bot ${state.currentPlayer}'s turn...`;
  }
}

// Handle drag start
function handleDragStart(e) {
  if (state.currentPlayer !== 0) return;
  state.draggedCardIndex = parseInt(e.target.getAttribute('data-index'));
  e.target.classList.add('selected');
}

// Handle drag end
function handleDragEnd(e) {
  // Don't reset draggedCardIndex to allow multiple drops
  e.target.classList.remove('selected');
}

// Handle drop
function handleDrop(e) {
  e.preventDefault();
  if (state.currentPlayer !== 0 || state.draggedCardIndex === null) return;

  const targetIndex = parseInt(e.target.getAttribute('data-index'));
  const targetType = e.target.getAttribute('data-type');

  if (targetType !== 'board') return;

  const boardCard = state.board[targetIndex];

  // If the target slot is empty, mark it as a place action (will be confirmed on submit)
  if (!boardCard || !boardCard.value || !boardCard.suit) {
    state.selectedBoardCards = [targetIndex];
    render();
    return;
  }

  // Otherwise, add the board card to the selection for capture
  if (!state.selectedBoardCards.includes(targetIndex)) {
    state.selectedBoardCards.push(targetIndex);
  }
  render();
}

// Handle submit action (validate and execute moves)
function handleSubmit() {
  if (state.currentPlayer !== 0 || state.draggedCardIndex === null || state.selectedBoardCards.length === 0) return;

  const handCard = state.hands[0][state.draggedCardIndex];
  const firstBoardIndex = state.selectedBoardCards[0];
  const firstBoardCard = state.board[firstBoardIndex];

  // If the first selected slot is empty, treat it as a place action (end turn)
  if (!firstBoardCard || !firstBoardCard.value || !firstBoardCard.suit) {
    handlePlaceCard(firstBoardIndex);
    return;
  }

  // Otherwise, attempt a capture
  const captures = canCapture(handCard, state.board);
  const selectedCapture = captures.find(cap =>
    cap.cards.every(i => state.selectedBoardCards.includes(i))
  );

  if (!selectedCapture) {
    document.getElementById('message').textContent = 'Invalid capture! Try a different combination.';
    state.selectedBoardCards = [];
    state.draggedCardIndex = null;
    render();
    return;
  }

  const capturedCards = [selectedCapture.target];
  state.board = state.board.filter((_, i) => !selectedCapture.cards.includes(i));
  state.hands[0] = state.hands[0].filter((_, i) => i !== state.draggedCardIndex);
  state.scores.player += scoreCards(capturedCards);

  if (state.board.length === 0 && state.hands[0].length > 0) {
    const nextCard = state.hands[0][0];
    if (nextCard && nextCard.value && nextCard.suit) {
      state.board.push(nextCard);
      state.hands[0] = state.hands[0].slice(1);
    }
  }

  state.draggedCardIndex = null;
  state.selectedBoardCards = [];
  checkGameEnd();
  render();
  // Do not advance to the next player; allow multiple captures
}

// Handle place card action (ends the turn)
function handlePlaceCard(boardIndex) {
  const handCard = state.hands[0][state.draggedCardIndex];
  
  // Place the card in the specified board slot if empty
  if (!state.board[boardIndex]) {
    state.board[boardIndex] = handCard;
  } else {
    state.board.push(handCard);
  }
  
  state.hands[0] = state.hands[0].filter((_, i) => i !== state.draggedCardIndex);
  state.draggedCardIndex = null;
  state.selectedBoardCards = [];
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
      const winner = state.scores.player >= 500 ? 'Player' :
                     state.scores.bot1 >= 500 ? 'Bot 1' :
                     state.scores.bot2 >= 500 ? 'Bot 2' :
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
      document.getElementById('message').textContent = "New round! Drag a card from your hand to the board.";
    }
  }
}

// Event listeners
document.getElementById('submit-btn').addEventListener('click', handleSubmit);
document.getElementById('restart-btn').addEventListener('click', initGame);

// Start the game
initGame();