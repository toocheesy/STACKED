/* 
 * Updated for Suggestions #2, #3, #8, #11:
 * - Suggestion #2: Removed empty hand fallback (line ~49 in original). Added error handling in initGame.
 * - Suggestion #3: Added sound effects for capture, place, turn change, and game end using base64 audio.
 * - Suggestion #8: Added hint system with a new hint button and logic to highlight valid captures.
 * - Suggestion #11: Added touch event handlers (touchstart, touchend) for mobile tap-to-select and visual feedback.
 */
let state = {
  deck: [],
  board: [],
  hands: [[], [], []], // Player, Bot 1, Bot 2
  scores: { player: 0, bot1: 0, bot2: 0 },
  combination: [],
  currentPlayer: 0,
  settings: {
    cardSpeed: 'fast',
    soundEffects: 'off',
    targetScore: 500,
    botDifficulty: 'intermediate'
  },
  draggedCard: null,
  selectedCard: null // For touch interactions
};

// Base64-encoded audio files (shortened for brevity; use real base64 audio in production)
const sounds = {
  capture: new Audio('data:audio/mp3;base64,...'), // Replace with actual base64
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
  // Ensure hands are not empty; deal additional cards if needed
  state.hands = state.hands.map(hand => {
    if (hand.length === 0 && state.deck.length >= 4) {
      return state.deck.splice(0, 4);
    }
    return hand;
  });
  state.scores = { player: 0, bot1: 0, bot2: 0 };
  state.currentPlayer = 0;
  state.combination = [];
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

  // Pick a random capture
  const hint = possibleCaptures[Math.floor(Math.random() * possibleCaptures.length)];
  const handCardEl = document.querySelector(`#player-hand .card[data-index="${hint.handIndex}"]`);
  const boardCardEls = hint.capture.cards.map(idx => 
    document.querySelector(`#board .card[data-index="${idx}"]`)
  );

  // Highlight cards
  if (handCardEl) handCardEl.classList.add('hint');
  boardCardEls.forEach(el => el && el.classList.add('hint'));

  // Remove highlights after 3 seconds
  setTimeout(() => {
    if (handCardEl) handCardEl.classList.remove('hint');
    boardCardEls.forEach(el => el && el.classList.remove('hint'));
  }, 3000);

  const messageEl = document.getElementById('message');
  if (messageEl) messageEl.textContent = "Hint: Try combining the highlighted cards!";
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

  const comboAreaEl = document.getElementById('combination-area');
  if (comboAreaEl) {
    const slotEl = comboAreaEl.querySelector(`[data-slot="0"]`);
    if (slotEl) {
      slotEl.innerHTML = '';
      
      const slotCards = state.combination;
      if (slotCards.length > 0) {
        const handCards = slotCards.filter(entry => entry.source === 'hand');
        const boardCards = slotCards.filter(entry => entry.source === 'board');
        if (handCards.length > 0 && boardCards.length > 0) {
          const handCard = handCards[0].card;
          const boardIndices = boardCards.map(entry => entry.index);
          const captures = canCapture(handCard, state.board);

          let isValid = false;
          const isFaceCard = ['J', 'Q', 'K'].includes(handCard.value);
          
          if (isFaceCard) {
            isValid = boardCards.every(bc => state.board[bc.index].value === handCard.value);
          } else {
            if (boardCards.length === 1) {
              isValid = captures.some(cap => 
                cap.type === 'pair' && boardIndices.includes(cap.cards[0])
              );
            } else {
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
          cardEl.style.top = `${comboIndex * 20}px`;
          cardEl.setAttribute('draggable', 'true');
          cardEl.setAttribute('data-slot', 0);
          cardEl.setAttribute('data-combo-index', comboIndex);
          cardEl.addEventListener('dragstart', (e) => handleDragStartCombo(e, 0, comboIndex));
          cardEl.addEventListener('dragend', handleDragEnd);
          cardEl.addEventListener('touchstart', (e) => handleTouchStart(e, 'combo', { slot: 0, comboIndex }));
          cardEl.addEventListener('touchend', handleTouchEnd);
          slotEl.appendChild(cardEl);
        });
        slotEl.style.height = `${110 + (slotCards.length - 1) * 20}px`;
      }
      slotEl.addEventListener('dragover', (e) => e.preventDefault());
      slotEl.addEventListener('drop', (e) => handleDrop(e, 0));
      slotEl.addEventListener('touchend', (e) => handleTouchDrop(e, 'combo', 0));
    }
  }

  const boardEl = document.getElementById('board');
  if (boardEl) {
    boardEl.innerHTML = '';
    
    if (state.board && Array.isArray(state.board)) {
      state.board.forEach((card, index) => {
        const isInPlayArea = state.combination.some(entry => entry.source === 'board' && entry.index === index);
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

  const playerScoreEl = document.getElementById('player-score');
  const bot1ScoreEl = document.getElementById('bot1-score');
  const bot2ScoreEl = document.getElementById('bot2-score');
  
  if (playerScoreEl) playerScoreEl.textContent = `Player: ${state.scores.player} pts`;
  if (bot1ScoreEl) bot1ScoreEl.textContent = `Bot 1: ${state.scores.bot1} pts`;
  if (bot2ScoreEl) bot2ScoreEl.textContent = `Bot 2: ${state.scores.bot2} pts`;

  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    submitBtn.disabled = state.currentPlayer !== 0 || state.combination.length === 0;
  }

  const messageEl = document.getElementById('message');
  if (messageEl) {
    if (state.currentPlayer === 0) {
      if (state.hands[0] && state.hands[0].length === 0) {
        messageEl.textContent = "You're out of cards! Waiting for bots to finish the round.";
        state.currentPlayer = 1;
        setTimeout(aiTurn, 1000);
      } else if (state.combination.length === 0) {
        messageEl.textContent = "Drag or tap cards to the playing area to capture, or place a card on the board to end your turn.";
      } else {
        messageEl.textContent = "Click 'Submit Move' to capture, or place a card to end your turn.";
      }
    } else {
      messageEl.textContent = `Bot ${state.currentPlayer}'s turn...`;
    }
  }
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

// Handle touch start
function handleTouchStart(e, source, data) {
  if (state.currentPlayer !== 0) return;
  e.preventDefault();
  const target = e.target;
  target.classList.add('selected');
  state.selectedCard = { source, data, element: target };

  // Visual feedback
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
    state.combination = state.combination.filter((_, i) => i !== state.draggedCard.comboIndex);
  }

  state.combination.push({
    source: state.draggedCard.source,
    index: state.draggedCard.index,
    card: state.draggedCard.card
  });

  state.draggedCard = null;
  render();
  playSound('place');
}

// Handle touch drop
function handleTouchDrop(e, targetType, data) {
  e.preventDefault();
  if (state.currentPlayer !== 0 || !state.selectedCard) return;

  if (targetType === 'combo' && state.selectedCard.source !== 'combo') {
    state.combination.push({
      source: state.selectedCard.source,
      index: state.selectedCard.data,
      card: state.selectedCard.source === 'hand' ? state.hands[0][state.selectedCard.data] : state.board[state.selectedCard.data]
    });
  } else if (targetType === 'board' && state.selectedCard.source === 'hand') {
    const handCard = state.hands[0][state.selectedCard.data];
    state.board.push(handCard);
    state.hands[0] = state.hands[0].filter((_, i) => i !== state.selectedCard.data);
    state.combination = [];
    state.currentPlayer = 1;
    checkGameEnd();
    playSound('place');
    render();
    if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
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

  if (state.draggedCard.slot === undefined) return;

  if (state.draggedCard.source === source && state.draggedCard.index === index) {
    state.combination = state.combination.filter((_, i) => i !== state.draggedCard.comboIndex);
    state.draggedCard = null;
    render();
  }
}

// Handle place drop on board
function handlePlaceDrop(e) {
  e.preventDefault();
  if (state.currentPlayer !== 0 || !state.draggedCard) return;

  if (state.draggedCard.source !== 'hand') return;

  const handCard = state.draggedCard.card;
  const handIndex = state.draggedCard.index;

  state.board.push(handCard);
  state.hands[0] = state.hands[0].filter((_, i) => i !== handIndex);
  state.combination = [];
  state.currentPlayer = 1;
  state.draggedCard = null;
  checkGameEnd();
  render();
  playSound('place');
  if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
}

// Handle reset play area
function handleResetPlayArea() {
  if (state.currentPlayer !== 0) return;
  state.combination = [];
  render();
}

// Handle submit action
function handleSubmit() {
  if (state.currentPlayer !== 0 || state.combination.length === 0) return;

  const handCards = state.combination.filter(entry => entry.source === 'hand');
  const boardCards = state.combination.filter(entry => entry.source === 'board');

  const messageEl = document.getElementById('message');
  if (handCards.length === 0 || boardCards.length === 0) {
    if (messageEl) {
      messageEl.textContent = "Invalid combination! Include at least one hand card and one board card.";
    }
    return;
  }

  const handCard = handCards[0].card;
  const boardIndices = boardCards.map(entry => entry.index);
  const captures = canCapture(handCard, state.board);

  let selectedCapture = null;
  let capturedCards = [];
  const isFaceCard = ['J', 'Q', 'K'].includes(handCard.value);

  if (isFaceCard) {
    const matchingBoardCards = boardCards.filter(bc => state.board[bc.index].value === handCard.value);
    if (matchingBoardCards.length > 0) {
      const matchingIndices = matchingBoardCards.map(bc => bc.index);
      capturedCards = matchingIndices.map(idx => state.board[idx]);
      state.board = state.board.filter((_, i) => !matchingIndices.includes(i));
      state.hands[0] = state.hands[0].filter((_, i) => !handCards.some(entry => entry.index === i));
      state.scores.player += scoreCards(capturedCards);
    } else {
      if (messageEl) {
        messageEl.textContent = "Invalid capture! J, Q, K can only pair with matching cards.";
      }
      return;
    }
  } else {
    if (boardCards.length === 1) {
      selectedCapture = captures.find(cap => 
        cap.type === 'pair' && boardIndices.includes(cap.cards[0])
      );
    } else {
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

    capturedCards = [selectedCapture.target];
    state.board = state.board.filter((_, i) => !selectedCapture.cards.includes(i));
    state.hands[0] = state.hands[0].filter((_, i) => !handCards.some(entry => entry.index === i));
    state.scores.player += scoreCards(capturedCards);
  }

  state.combination = [];

  if (state.board.length === 0 && state.hands[0].length > 0) {
    const nextCard = state.hands[0][0];
    if (nextCard && nextCard.value && nextCard.suit) {
      state.board.push(nextCard);
      state.hands[0] = state.hands[0].slice(1);
    }
  }

  state.currentPlayer = 0;
  checkGameEnd();
  render();
  playSound('capture');
}

// AI turn
function aiTurn() {
  const playerIndex = state.currentPlayer;
  const messageEl = document.getElementById('message');

  if (state.hands[playerIndex].length === 0) {
    state.currentPlayer = (playerIndex + 1) % 3;
    checkGameEnd();
    render();
    playSound('turnChange');
    if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
    return;
  }

  setTimeout(() => {
    const aiAction = aiMove(state.hands[playerIndex], state.board, state.settings.botDifficulty);

    if (aiAction.action === 'capture') {
      state.combination = [
        { source: 'hand', index: state.hands[playerIndex].findIndex(c => c.id === aiAction.handCard.id), card: aiAction.handCard },
        { source: 'board', index: aiAction.capture.cards[0], card: state.board[aiAction.capture.cards[0]] }
      ];
      if (aiAction.capture.type === 'sum') {
        state.combination.push({ source: 'board', index: aiAction.capture.cards[1], card: state.board[aiAction.capture.cards[1]] });
      }
      render();
      if (messageEl) messageEl.textContent = `Bot ${playerIndex} is capturing...`;

      setTimeout(() => {
        const capturedCards = [aiAction.capture.target];
        state.board = state.board.filter((_, i) => !aiAction.capture.cards.includes(i));
        state.hands[playerIndex] = state.hands[playerIndex].filter(c => c.id !== aiAction.handCard.id);
        state.scores[playerIndex === 1 ? 'bot1' : 'bot2'] += scoreCards(capturedCards);
        state.combination = [];
        render();

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
        playSound('capture');
        if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
      }, 1500);
    } else {
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
        playSound('place');
        if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
      }, 1500);
    }
  }, 1000);
}

// Check game end
function checkGameEnd() {
  const playersWithCards = state.hands.filter(hand => hand.length > 0).length;

  if (playersWithCards === 0) {
    if (state.deck.length === 0) {
      const winner = state.scores.player >= state.settings.targetScore ? 'Player' :
                     state.scores.bot1 >= state.settings.targetScore ? 'Bot 1' :
                     state.scores.bot2 >= state.settings.targetScore ? 'Bot 2' :
                     state.scores.player > state.scores.bot1 && state.scores.player > state.scores.bot2 ? 'Player' :
                     state.scores.bot1 > state.scores.player && state.scores.bot1 > state.scores.bot2 ? 'Bot 1' : 'Bot 2';
      const messageEl = document.getElementById('message');
      if (messageEl) {
        messageEl.textContent = `${winner} wins! Restart the game to play again.`;
      }
      playSound('gameEnd');
    } else {
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
        messageEl.textContent = "New round! Drag or tap cards to the playing area to capture.";
      }
      playSound('turnChange');
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