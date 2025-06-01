let state = {
  deck: [],
  board: [],
  hands: [[], [], []], // Player, Bot 1, Bot 2
  scores: { player: 0, bot1: 0, bot2: 0 },
  selectedHandCard: null,
  selectedBoardCards: [],
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
  console.log('Initial state:', state);
  // new Audio('assets/sounds/shuffle.mp3').play().catch(() => {});
  render();
  showSettingsModal();
}

// Show settings modal on first load
function showSettingsModal() {
  if (localStorage.getItem('stackedTutorialSeen')) {
    return;
  }
  const modal = document.getElementById('settings-modal');
  modal.style.display = 'flex';

  document.getElementById('start-game-btn').addEventListener('click', () => {
    state.settings.cardSpeed = document.getElementById('card-speed').value;
    state.settings.soundEffects = document.getElementById('sound-effects').value;
    localStorage.setItem('stackedTutorialSeen', 'true');
    modal.style.display = 'none';
  });

  document.getElementById('skip-settings-btn').addEventListener('click', () => {
    localStorage.setItem('stackedTutorialSeen', 'true');
    modal.style.display = 'none';
  });
}

// Render the game state to the DOM
function render() {
  // Render board
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  console.log('Rendering board cards:', state.board);
  state.board.forEach((card, index) => {
    if (!card || !card.value || !card.suit) {
      console.warn('Invalid card on board:', card, 'at index:', index);
      return;
    }
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : ''} ${
      state.selectedBoardCards.includes(index) ? 'selected' : ''
    }`;
    cardEl.textContent = `${card.value}${suitSymbols[card.suit]}`; // Fallback to text
    // cardEl.style.backgroundImage = `url('assets/cards/${card.value}${card.suit[0]}.png')`;
    // cardEl.style.backgroundSize = 'cover';
    // cardEl.style.backgroundPosition = 'center';
    cardEl.addEventListener('click', () => handleBoardCardClick(index));
    boardEl.appendChild(cardEl);
  });

  // Render player's hand
  const handEl = document.getElementById('player-hand');
  handEl.innerHTML = '';
  console.log('Rendering player hand:', state.hands[0]);
  state.hands[0].forEach((card, index) => {
    if (!card || !card.value || !card.suit) {
      console.warn('Invalid card in hand:', card, 'at index:', index);
      return;
    }
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : ''} ${
      state.selectedHandCard === index ? 'selected' : ''
    }`;
    cardEl.textContent = `${card.value}${suitSymbols[card.suit]}`; // Fallback to text
    // cardEl.style.backgroundImage = `url('assets/cards/${card.value}${card.suit[0]}.png')`;
    // cardEl.style.backgroundSize = 'cover';
    // cardEl.style.backgroundPosition = 'center';
    cardEl.addEventListener('click', () => handleHandCardClick(index));
    handEl.appendChild(cardEl);
  });

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

  // Update buttons
  const captureBtn = document.getElementById('capture-btn');
  const placeBtn = document.getElementById('place-btn');
  captureBtn.disabled = state.currentPlayer !== 0 || state.selectedHandCard === null || state.selectedBoardCards.length === 0;
  placeBtn.disabled = state.currentPlayer !== 0 || state.selectedHandCard === null;

  // Update message with better feedback
  const messageEl = document.getElementById('message');
  if (state.currentPlayer === 0) {
    if (state.selectedHandCard === null) {
      messageEl.textContent = "Your turn! Select a card from your hand.";
    } else if (state.selectedBoardCards.length === 0) {
      messageEl.textContent = "Select board cards to capture, or place your card.";
    } else {
      messageEl.textContent = "Click 'Capture' to capture, or 'Place Card' to place.";
    }
  } else {
    messageEl.textContent = `Bot ${state.currentPlayer}'s turn...`;
  }
}

// Handle hand card clicks
function handleHandCardClick(index) {
  if (state.currentPlayer !== 0) return;
  state.selectedHandCard = state.selectedHandCard === index ? null : index;
  console.log('Selected hand card:', state.selectedHandCard);
  render();
}

// Handle board card clicks
function handleBoardCardClick(index) {
  if (state.currentPlayer !== 0) return;
  if (state.selectedBoardCards.includes(index)) {
    state.selectedBoardCards = state.selectedBoardCards.filter(i => i !== index);
  } else {
    state.selectedBoardCards.push(index);
  }
  render();
}

// Handle capture action
function handleCapture() {
  const handCard = state.hands[0][state.selectedHandCard];
  const captures = canCapture(handCard, state.board);
  const selectedCapture = captures.find(cap =>
    cap.cards.every(i => state.selectedBoardCards.includes(i))
  );

  if (!selectedCapture) {
    document.getElementById('message').textContent = 'Invalid capture!';
    return;
  }

  const capturedCards = [selectedCapture.target];
  state.board = state.board.filter((_, i) => !selectedCapture.cards.includes(i));
  state.hands[0] = state.hands[0].filter((_, i) => i !== state.selectedHandCard);
  state.scores.player += scoreCards(capturedCards);
  // new Audio('assets/sounds/capture.mp3').play().catch(() => {});

  if (state.board.length === 0 && state.hands[0].length > 0) {
    const nextCard = state.hands[0][0];
    if (nextCard && nextCard.value && nextCard.suit) {
      state.board.push(nextCard);
      state.hands[0] = state.hands[0].slice(1);
    }
  }

  state.selectedHandCard = null;
  state.selectedBoardCards = [];
  state.currentPlayer = 1;
  checkGameEnd();
  render();
  if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
}

// Handle place card action
function handlePlaceCard() {
  const handCard = state.hands[0][state.selectedHandCard];
  state.board.push(handCard);
  state.hands[0] = state.hands[0].filter((_, i) => i !== state.selectedHandCard);
  state.selectedHandCard = null;
  state.currentPlayer = 1;
  checkGameEnd();
  render();
  if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
}

// AI turn
function aiTurn() {
  const playerIndex = state.currentPlayer;
  const aiAction = aiMove(state.hands[playerIndex], state.board);

  if (aiAction.action === 'capture') {
    const capturedCards = [aiAction.capture.target];
    state.board = state.board.filter((_, i) => !aiAction.capture.cards.includes(i));
    state.hands[playerIndex] = state.hands[playerIndex].filter(c => c.id !== aiAction.handCard.id);
    state.scores[playerIndex === 1 ? 'bot1' : 'bot2'] += scoreCards(capturedCards);
    // new Audio('assets/sounds/capture.mp3').play().catch(() => {});
  } else {
    state.board.push(aiAction.handCard);
    state.hands[playerIndex] = state.hands[playerIndex].filter(c => c.id !== aiAction.handCard.id);
  }

  if (state.board.length === 0 && state.hands[playerIndex].length > 0) {
    const nextCard = state.hands[playerIndex][0];
    if (nextCard && nextCard.value && nextCard.suit) {
      state.board.push(nextCard);
      state.hands[playerIndex] = state.hands[playerIndex].slice(1);
    }
  }

 用心

  state.currentPlayer = (playerIndex + 1) % 3;
  checkGameEnd();
  render();
  if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
}

// Check if the game has ended
function checkGameEnd() {
  const playersWithCards = state.hands.filter(hand => hand.length > 0).length;
  if (playersWithCards <= 1 && state.deck.length === 0) {
    const winner = state.scores.player >= 500 ? 'Player' :
                   state.scores.bot1 >= 500 ? 'Bot 1' :
                   state.scores.bot2 >= 500 ? 'Bot 2' :
                   state.scores.player > state.scores.bot1 && state.scores.player > state.scores.bot2 ? 'Player' :
                   state.scores.bot1 > state.scores.player && state.scores.bot1 > state.scores.bot2 ? 'Bot 1' : 'Bot 2';
    document.getElementById('message').textContent = `${winner} wins! Restart the game to play again.`;
    document.getElementById('capture-btn').disabled = true;
    document.getElementById('place-btn').disabled = true;
  } else if (playersWithCards <= 1) {
    const { players, board } = dealCards(shuffleDeck(state.deck));
    state.deck = [];
    state.board = board.length > 0 ? board : state.board;
    state.hands = players;
    // new Audio('assets/sounds/shuffle.mp3').play().catch(() => {});
    state.currentPlayer = 0;
  }
}

// Event listeners
document.getElementById('capture-btn').addEventListener('click', handleCapture);
document.getElementById('place-btn').addEventListener('click', handlePlaceCard);
document.getElementById('restart-btn').addEventListener('click', initGame);

// Start the game
initGame();