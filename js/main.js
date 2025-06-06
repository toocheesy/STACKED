let state = {
  deck: [],
  board: [],
  hands: [[], [], []], // Player, Bot 1, Bot 2
  scores: { player: 0, bot1: 0, bot2: 0 },
  combination: [], // Single array for one play area slot
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
  let deck;
  try {
    deck = shuffleDeck(createDeck());
  } catch (e) {
    console.error('Failed to create/shuffle deck:', e);
    deck = createDeck(); // Fallback to unshuffled deck
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
  state.hands = state.hands.map(hand => hand.length > 0 ? hand : [{ suit: 'Hearts', value: '3', id: '3-Hearts' }]);
  state.scores = { player: 0, bot1: 0, bot2: 0 };
  state.currentPlayer = 0;
  state.combination = [];
  state.draggedCard = null;
  render();
  showSettingsModal();
}

// Show settings modal
function showSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.showModal(); // Use native dialog method to show modal with backdrop

    const startGameBtn = document.getElementById('start-game-btn');
    if (startGameBtn) {
      startGameBtn.addEventListener('click', () => {
        state.settings.cardSpeed = document.getElementById('card-speed').value;
        state.settings.soundEffects = document.getElementById('sound-effects').value;
        state.settings.targetScore = parseInt(document.getElementById('target-score').value);
        modal.close(); // Close the modal using native method
        render();
      });
    }
  }
}

// Render the game state to the DOM
function render() {
  // Update deck count
  const deckCountEl = document.getElementById('deck-count');
  if (deckCountEl) {
    deckCountEl.textContent = `Deck: ${state.deck.length || 0} cards`;
  }

  // Dynamically adjust table width and bot card positions
  const tableEl = document.querySelector('.table');
  if (tableEl) {
    const cardCount = state.board ? state.board.length : 0;
    const baseWidth = 800; // Minimum table width
    const cardWidth = 80; // 70px card + 10px gap
    const tableWidth = Math.max(baseWidth, cardCount <= 4 ? baseWidth : (cardCount * cardWidth) + 100); // Add padding
    tableEl.style.width = `${tableWidth}px`;
    
    const botOffset = -20 - (cardCount > 4 ? (cardCount - 4) * 10 : 0); // Move bots outward
    const bot1HandEl = document.querySelector('.bot1-hand');
    const bot2HandEl = document.querySelector('.bot2-hand');
    if (bot1HandEl) bot1HandEl.style.left = `${botOffset}px`;
    if (bot2HandEl) bot2HandEl.style.right = `${botOffset}px`;
  }

  // Render playing area - single slot
  const comboAreaEl = document.getElementById('combination-area');
  if (comboAreaEl) {
    const slotEl = comboAreaEl.querySelector(`[data-slot="0"]`);
    if (slotEl) {
      slotEl.innerHTML = '';
      
      const slotCards = state.combination;
      // Add green glow if the combination is valid
      if (slotCards.length > 0) {
        const handCards = slotCards.filter(entry => entry.source === 'hand');
        const boardCards = slotCards.filter(entry => entry.source === 'board');
        if (handCards.length > 0 && boardCards.length > 0) {
          const handCard = handCards[0].card;
          const boardIndices = boardCards.map(entry => entry.index);
          const captures = canCapture(handCard, state.board);

          let isValid = false;
          if (boardCards.length === 1) {
            // Pair capture
            isValid = captures.some(cap => 
              cap.type === 'pair' && boardIndices.includes(cap.cards[0])
            );
          } else {
            // Sum capture: Check all pairs of board cards in the slot
            for (let i = 0; i < boardCards.length; i++) {
              for (let j = i + 1; j < boardCards.length; j++) {
                const pairIndices = [boardCards[i].index, boardCards[j].index];
                const selectedCapture = captures.find(cap => {
                  if (cap.type === 'sum') {
                    const capIndices = cap.cards;
                    return capIndices.length === 2 && 
                           capIndices.every(idx => pairIndices.includes(idx)) && 
                           capIndices.sort().join(',') === pairIndices.sort().join(',');
                  }
                  return false;
                });
                if (selectedCapture) {
                  isValid = true;
                  break;
                }
              }
              if (isValid) break;
            }
          }

          if (isValid) {
            slotEl.classList.add('valid-combo');
          } else {
            slotEl.classList.remove('valid-combo');
          }
        } else {
          slotEl.classList.remove('valid-combo');
        }
      } else {
        slotEl.classList.remove('valid-combo');
      }

      if (slotCards.length === 0) {
        slotEl.style.backgroundColor = 'rgba(241, 196, 15, 0.1)';
        slotEl.style.border = '2px dashed #ccc';
      } else {
        slotCards.forEach((comboEntry, comboIndex) => {
          const card = comboEntry.card;
          const cardEl = document.createElement('div');
          cardEl.className = `card ${card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : ''}`;
          cardEl.textContent = `${card.value}${suitSymbols[card.suit]}`;
          cardEl.style.position = 'absolute';
          cardEl.style.top = `${comboIndex * 20}px`; // Stack cards vertically
          cardEl.setAttribute('draggable', 'true');
          cardEl.setAttribute('data-slot', 0);
          cardEl.setAttribute('data-combo-index', comboIndex);
          cardEl.addEventListener('dragstart', (e) => handleDragStartCombo(e, 0, comboIndex));
          cardEl.addEventListener('dragend', handleDragEnd);
          slotEl.appendChild(cardEl);
        });
        // Dynamically adjust slot height
        slotEl.style.height = `${110 + (slotCards.length - 1) * 20}px`;
      }
      slotEl.addEventListener('dragover', (e) => e.preventDefault());
      slotEl.addEventListener('drop', (e) => handleDrop(e, 0));
    }
  }

  // Render board - dynamic, no placeholders
  const boardEl = document.getElementById('board');
  if (boardEl) {
    boardEl.innerHTML = '';
    
    if (state.board && Array.isArray(state.board)) {
      state.board.forEach((card, index) => {
        // Skip rendering board cards that are in the play area
        const isInPlayArea = state.combination.some(entry => entry.source === 'board' && entry.index === index);
        if (isInPlayArea) return; // Skip this card

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
        boardEl.appendChild(cardEl);
      });
    }

    // Make the board itself a drop target for placing
    boardEl.addEventListener('dragover', (e) => e.preventDefault());
    boardEl.addEventListener('drop', handlePlaceDrop);
  }

  // Render player's hand - always render 4 slots
  const handEl = document.getElementById('player-hand');
  if (handEl) {
    handEl.innerHTML = '';
    
    for (let index = 0; index < 4; index++) {
      const card = state.hands[0] && state.hands[0][index] ? state.hands[0][index] : null;
      const cardEl = document.createElement('div');
      
      if (!card || !card.value || !card.suit || state.combination.some(entry => entry.source === 'hand' && entry.index === index)) {
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
  }

  // Render Bot 1's hand (card backs)
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

  // Render Bot 2's hand (card backs)
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

  // Update scores
  const playerScoreEl = document.getElementById('player-score');
  const bot1ScoreEl = document.getElementById('bot1-score');
  const bot2ScoreEl = document.getElementById('bot2-score');
  
  if (playerScoreEl) playerScoreEl.textContent = `Player: ${state.scores.player} pts`;
  if (bot1ScoreEl) bot1ScoreEl.textContent = `Bot 1: ${state.scores.bot1} pts`;
  if (bot2ScoreEl) bot2ScoreEl.textContent = `Bot 2: ${state.scores.bot2} pts`;

  // Update submit button
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    submitBtn.disabled = state.currentPlayer !== 0 || state.combination.length === 0;
  }

  // Update message
  const messageEl = document.getElementById('message');
  if (messageEl) {
    if (state.currentPlayer === 0) {
      if (state.hands[0] && state.hands[0].length === 0) {
        messageEl.textContent = "You're out of cards! Waiting for bots to finish the round.";
        state.currentPlayer = 1;
        setTimeout(aiTurn, 1000);
      } else if (state.combination.length === 0) {
        messageEl.textContent = "Drag cards to the playing area to capture, or drag a card to the board to place and end your turn.";
      } else {
        messageEl.textContent = "Click 'Submit Move' to capture, or drag a card to the board to place and end your turn.";
      }
    } else {
      messageEl.textContent = `Bot ${state.currentPlayer}'s turn...`;
    }
  }
}

// Handle drag start from hand or board
function handleDragStart(e, source, index) {
  if (state.currentPlayer !== 0) return;
  state.draggedCard = { source, index, card: source === 'hand' ? state.hands[0][index] : state.board[index] };
  e.target.classList.add('selected');
}

// Handle drag start from playing area
function handleDragStartCombo(e, slot, comboIndex) {
  if (state.currentPlayer !== 0) return;
  state.draggedCard = state.combination[comboIndex];
  state.draggedCard.slot = slot;
  state.draggedCard.comboIndex = comboIndex;
  e.target.classList.add('selected');
}

// Handle drag end
function handleDragEnd(e) {
  e.target.classList.remove('selected');
  state.draggedCard = null;
}

// Handle drop into playing area
function handleDrop(e, slot) {
  e.preventDefault();
  if (state.currentPlayer !== 0 || !state.draggedCard) return;

  // If the card is from the playing area, remove it from its original slot
  if (state.draggedCard.slot !== undefined) {
    state.combination = state.combination.filter((_, i) => i !== state.draggedCard.comboIndex);
  }

  // Add the card to the play area
  state.combination.push({
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

  // Check if the card being dropped is from the playing area
  if (state.draggedCard.slot === undefined) return;

  // Check if the drop target matches the card's original source and index
  if (state.draggedCard.source === source && state.draggedCard.index === index) {
    // Remove the card from the playing area
    state.combination = state.combination.filter((_, i) => i !== state.draggedCard.comboIndex);
    state.draggedCard = null;
    render();
  }
}

// Handle drop on the board to place a card and end the turn
function handlePlaceDrop(e) {
  e.preventDefault();
  if (state.currentPlayer !== 0 || !state.draggedCard) return;

  // Only allow hand cards to be placed on the board
  if (state.draggedCard.source !== 'hand') return;

  const handCard = state.draggedCard.card;
  const handIndex = state.draggedCard.index;

  // Place the card on the board
  state.board.push(handCard);
  state.hands[0] = state.hands[0].filter((_, i) => i !== handIndex);
  state.combination = []; // Clear play area
  state.currentPlayer = 1; // End player's turn
  state.draggedCard = null;
  checkGameEnd();
  render();
  if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
}

// Handle reset play area
function handleResetPlayArea() {
  if (state.currentPlayer !== 0) return; // Only allow during player's turn
  state.combination = []; // Clear the play area
  render();
}

// Handle submit action (validate and execute capture)
function handleSubmit() {
  if (state.currentPlayer !== 0 || state.combination.length === 0) return;

  // Check for at least one hand card and one board card
  const handCards = state.combination.filter(entry => entry.source === 'hand');
  const boardCards = state.combination.filter(entry => entry.source === 'board');

  const messageEl = document.getElementById('message');
  if (handCards.length === 0 || boardCards.length === 0) {
    if (messageEl) {
      messageEl.textContent = "Invalid combination! Include at least one hand card and one board card.";
    }
    return;
  }

  // Use the first hand card for the capture
  const handCard = handCards[0].card;
  const boardIndices = boardCards.map(entry => entry.index);
  const captures = canCapture(handCard, state.board);

  let selectedCapture = null;
  if (boardCards.length === 1) {
    // Pair capture: hand card matches a single board card
    selectedCapture = captures.find(cap => 
      cap.type === 'pair' && boardIndices.includes(cap.cards[0])
    );
  } else {
    // Sum capture: Find a pair of board cards that sum to a valid target
    for (let i = 0; i < boardCards.length; i++) {
      for (let j = i + 1; j < boardCards.length; j++) {
        const pairIndices = [boardCards[i].index, boardCards[j].index];
        selectedCapture = captures.find(cap => {
          if (cap.type === 'sum') {
            const capIndices = cap.cards;
            return capIndices.length === 2 && 
                   capIndices.every(idx => pairIndices.includes(idx)) && 
                   capIndices.sort().join(',') === pairIndices.sort().join(',');
          }
          return false;
        });
        if (selectedCapture) break;
      }
      if (selectedCapture) break;
    }
  }

  if (!selectedCapture) {
    if (messageEl) {
      messageEl.textContent = "Invalid capture! Try a different combination.";
    }
    return;
  }

  // Execute the capture
  const capturedCards = [selectedCapture.target];
  // Remove the captured board cards
  state.board = state.board.filter((_, i) => !selectedCapture.cards.includes(i));
  // Remove the hand card used for the capture
  state.hands[0] = state.hands[0].filter((_, i) => !handCards.some(entry => entry.index === i));
  // Update score
  state.scores.player += scoreCards(capturedCards);
  // Clear the play area
  state.combination = [];

  if (state.board.length === 0 && state.hands[0].length > 0) {
    const nextCard = state.hands[0][0];
    if (nextCard && nextCard.value && nextCard.suit) {
      state.board.push(nextCard);
      state.hands[0] = state.hands[0].slice(1);
    }
  }

  // Keep the player's turn active to allow multiple combos
  state.currentPlayer = 0;

  checkGameEnd();
  render();
}

// AI turn with delayed actions
function aiTurn() {
  const playerIndex = state.currentPlayer;
  const messageEl = document.getElementById('message');

  if (state.hands[playerIndex].length === 0) {
    // If bot is out of cards, move to the next player
    state.currentPlayer = (playerIndex + 1) % 3;
    checkGameEnd();
    render();
    if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
    return;
  }

  // Simulate bot thinking
  setTimeout(() => {
    const aiAction = aiMove(state.hands[playerIndex], state.board);

    if (aiAction.action === 'capture') {
      // Simulate bot dragging cards to the play area
      state.combination = [
        { source: 'hand', index: state.hands[playerIndex].findIndex(c => c.id === aiAction.handCard.id), card: aiAction.handCard },
        { source: 'board', index: aiAction.capture.cards[0], card: state.board[aiAction.capture.cards[0]] }
      ];
      if (aiAction.capture.type === 'sum') {
        state.combination.push({ source: 'board', index: aiAction.capture.cards[1], card: state.board[aiAction.capture.cards[1]] });
      }
      render();
      if (messageEl) messageEl.textContent = `Bot ${playerIndex} is capturing...`;

      // Simulate submitting the capture
      setTimeout(() => {
        const capturedCards = [aiAction.capture.target];
        state.board = state.board.filter((_, i) => !aiAction.capture.cards.includes(i));
        state.hands[playerIndex] = state.hands[playerIndex].filter(c => c.id !== aiAction.handCard.id);
        state.scores[playerIndex === 1 ? 'bot1' : 'bot2'] += scoreCards(capturedCards);
        state.combination = [];
        render();

        // Handle board refresh if empty
        if (state.board.length === 0 && state.hands[playerIndex].length > 0) {
          const nextCard = state.hands[playerIndex][0];
          if (nextCard && nextCard.value && nextCard.suit) {
            state.board.push(nextCard);
            state.hands[playerIndex] = state.hands[playerIndex].slice(1);
            render();
          }
        }

        // Move to next player
        state.currentPlayer = (playerIndex + 1) % 3;
        checkGameEnd();
        render();
        if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
      }, 1500); // Delay to show the capture
    } else {
      // Simulate bot placing a card
      if (messageEl) messageEl.textContent = `Bot ${playerIndex} is placing a card...`;
      setTimeout(() => {
        state.board.push(aiAction.handCard);
        state.hands[playerIndex] = state.hands[playerIndex].filter(c => c.id !== aiAction.handCard.id);
        state.combination = [];

        if (state.board.length === 0 && state.hands[playerIndex].length > 0) {
          const nextCard = state.hands[playerIndex][0];
          if (nextCard && nextCard.value && nextCard.suit) {
            state.board.push(nextCard);
            state.hands[playerIndex] = state.hands[playerIndex].slice(1);
            render();
          }
        }

        state.currentPlayer = (playerIndex + 1) % 3;
        checkGameEnd();
        render();
        if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
      }, 1500); // Delay to show the placement
    }
  }, 1000); // Initial thinking delay
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
      const messageEl = document.getElementById('message');
      if (messageEl) {
        messageEl.textContent = `${winner} wins! Restart the game to play again.`;
      }
    } else {
      // Start a new round: deal 4 cards to each player
      let dealResult;
      try {
        dealResult = dealCards(state.deck, 3, 4, 4);
      } catch (e) {
        console.error('Failed to deal cards in new round:', e);
        dealResult = { players: [[], [], []], board: [], remainingDeck: state.deck };
      }
      state.deck = dealResult.remainingDeck || state.deck;
      state.board = dealResult.board || [];
      state.hands = dealResult.players && dealResult.players.length === 3 ? dealResult.players : [[], [], []];
      state.currentPlayer = 0;
      const messageEl = document.getElementById('message');
      if (messageEl) {
        messageEl.textContent = "New round! Drag cards to the playing area to capture.";
      }
    }
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  const submitBtn = document.getElementById('submit-btn');
  const restartBtn = document.getElementById('restart-btn');
  const resetBtn = document.getElementById('reset-play-area-btn');
  
  if (submitBtn) {
    submitBtn.addEventListener('click', handleSubmit);
  }
  
  if (restartBtn) {
    restartBtn.addEventListener('click', initGame);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', handleResetPlayArea);
  }
});

// Start the game
initGame();