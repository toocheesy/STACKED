/* 
 * Clean main.js - Fixed version without duplicate declarations
 * Updated to work with gameLogic.js global functions
 */
let state = {
  deck: [],
  board: [],
  hands: [[], [], []], // Player, Bot 1, Bot 2
  scores: { player: 0, bot1: 0, bot2: 0 },
  combination: { 0: [], 1: [] }, // Slot 0: Play Area, Slot 1: Principal Match
  currentPlayer: 0,
  settings: {
    cardSpeed: 'fast',
    soundEffects: 'off',
    targetScore: 500,
    botDifficulty: 'intermediate'
  },
  draggedCard: null,
  selectedCard: null
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
  state.hands = state.hands.map(hand => {
    if (hand.length === 0 && state.deck.length >= 4) {
      return state.deck.splice(0, 4);
    }
    return hand;
  });
  state.scores = { player: 0, bot1: 0, bot2: 0 };
  state.currentPlayer = 0;
  state.combination = { 0: [], 1: [] };
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
    const aiAction = aiMove(state.hands[playerIndex], state.board, state.settings.botDifficulty);

    if (aiAction.action === 'capture') {
      // Simple AI capture logic
      const handCard = aiAction.handCard;
      const handIndex = state.hands[playerIndex].findIndex(card => card.id === handCard.id);
      
      // Find a simple capture (pair or sum)
      let captureFound = false;
      
      // Try pair capture first
      for (let i = 0; i < state.board.length; i++) {
        if (state.board[i].value === handCard.value) {
          // Set up pair capture
          state.combination[0] = [{ source: 'board', index: i, card: state.board[i] }];
          state.combination[1] = [{ source: 'hand', index: handIndex, card: handCard }];
          captureFound = true;
          break;
        }
      }
      
      // If no pair found, try simple sum
      if (!captureFound) {
        const handValue = parseInt(handCard.value) || (window.valueMap && window.valueMap[handCard.value]) || 1;
        for (let i = 0; i < state.board.length; i++) {
          const boardCard = state.board[i];
          const boardValue = parseInt(boardCard.value) || (window.valueMap && window.valueMap[boardCard.value]) || 1;
          
          // Look for another board card that equals handCard + boardCard
          for (let j = 0; j < state.board.length; j++) {
            if (i === j) continue;
            const targetCard = state.board[j];
            const targetValue = parseInt(targetCard.value) || (window.valueMap && window.valueMap[targetCard.value]) || 1;
            
            if (handValue + boardValue === targetValue) {
              state.combination[0] = [
                { source: 'hand', index: handIndex, card: handCard },
                { source: 'board', index: i, card: boardCard }
              ];
              state.combination[1] = [{ source: 'board', index: j, card: targetCard }];
              captureFound = true;
              break;
            }
          }
          if (captureFound) break;
        }
      }

      if (captureFound) {
        render();
        if (messageEl) messageEl.textContent = `Bot ${playerIndex} is capturing...`;

        setTimeout(() => {
          const capturedCards = [...state.combination[0].map(c => c.card), ...state.combination[1].map(c => c.card)];
          
          // Remove from board
          state.board = state.board.filter((_, i) => 
            !state.combination[0].some(entry => entry.source === 'board' && entry.index === i) &&
            !state.combination[1].some(entry => entry.source === 'board' && entry.index === i)
          );
          
          // Remove from hand
          state.hands[playerIndex] = state.hands[playerIndex].filter(card => card.id !== handCard.id);
          
          // Score
          const scoreFunction = window.scoreCards || function(cards) { return cards.length * 5; };
          state.scores[playerIndex === 1 ? 'bot1' : 'bot2'] += scoreFunction(capturedCards);
          state.combination = { 0: [], 1: [] };
          
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
          playSound('capture');
          if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
        }, 1500);
      } else {
        // No capture found, place card instead
        aiAction.action = 'place';
      }
    }
    
    if (aiAction.action === 'place') {
      if (messageEl) messageEl.textContent = `Bot ${playerIndex} is placing a card...`;
      setTimeout(() => {
        const handCard = aiAction.handCard || state.hands[playerIndex][0];
        state.board.push(handCard);
        state.hands[playerIndex] = state.hands[playerIndex].filter(c => c.id !== handCard.id);
        state.combination = { 0: [], 1: [] };

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
        messageEl.textContent = "New round! Drag or tap cards to the play areas to capture.";
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
initGame();if (handCardEl) handCardEl.classList.remove('hint');
    boardCardEls.forEach(el => el && el.classList.remove('hint'));
    

  const messageEl = document.getElementById('message');
  if (messageEl) messageEl.textContent = "Hint: Try combining the highlighted cards!";


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
  let captureTypeMessage = "No cards in play areas.";
  if (comboAreaEl) {
    const slot0El = comboAreaEl.querySelector('[data-slot="0"]');
    const slot1El = comboAreaEl.querySelector('[data-slot="1"]');
    if (slot0El && slot1El) {
      // Render Play Area (Slot 0)
      slot0El.innerHTML = '';
      const slot0Cards = state.combination[0];
      if (slot0Cards.length > 0) {
        slot0Cards.forEach((comboEntry, comboIndex) => {
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
          slot0El.appendChild(cardEl);
        });
        slot0El.style.height = `${110 + (slot0Cards.length - 1) * 20}px`;
      } else {
        slot0El.style.backgroundColor = 'rgba(241, 196, 15, 0.1)';
        slot0El.style.border = '2px dashed #ccc';
      }

      // Render Principal Match Area (Slot 1)
      slot1El.innerHTML = '';
      const slot1Cards = state.combination[1];
      if (slot1Cards.length > 0) {
        const principalCard = slot1Cards[0].card; // Only one card allowed in principal match
        const cardEl = document.createElement('div');
        cardEl.className = `card ${principalCard.suit === 'Hearts' || principalCard.suit === 'Diamonds' ? 'red' : ''}`;
        cardEl.textContent = `${principalCard.value}${suitSymbols[principalCard.suit]}`;
        cardEl.style.position = 'absolute';
        cardEl.setAttribute('draggable', 'true');
        cardEl.setAttribute('data-slot', 1);
        cardEl.setAttribute('data-combo-index', 0);
        cardEl.addEventListener('dragstart', (e) => handleDragStartCombo(e, 1, 0));
        cardEl.addEventListener('dragend', handleDragEnd);
        cardEl.addEventListener('touchstart', (e) => handleTouchStart(e, 'combo', { slot: 1, comboIndex: 0 }));
        cardEl.addEventListener('touchend', handleTouchEnd);
        slot1El.appendChild(cardEl);
        slot1El.style.height = '110px';
      } else {
        slot1El.style.backgroundColor = 'rgba(241, 196, 15, 0.1)';
        slot1El.style.border = '2px dashed #ccc';
      }

      // Validation using global valueMap from gameLogic.js
      let isValid = false;
      let captureType = "";
      let captureDetails = "";
      if (slot0Cards.length > 0 && slot1Cards.length === 1) {
        const hasHandCard = slot0Cards.some(entry => entry.source === 'hand') || slot1Cards[0].source === 'hand';
        const hasBoardCard = slot0Cards.some(entry => entry.source === 'board') || slot1Cards[0].source === 'board';
        if (hasHandCard && hasBoardCard) {
          const principalValue = parseInt(slot1Cards[0].card.value) || (window.valueMap && window.valueMap[slot1Cards[0].card.value]) || 1;
          const sumValues = slot0Cards.map(entry => parseInt(entry.card.value) || (window.valueMap && window.valueMap[entry.card.value]) || 1);
          const totalSum = sumValues.reduce((a, b) => a + b, 0);
          if (totalSum === principalValue) {
            isValid = true;
            captureType = "Sum Capture";
            captureDetails = `${sumValues.join(' + ')} = ${principalValue}.`;
          } else if (slot0Cards.length === 1 && slot0Cards[0].card.value === slot1Cards[0].card.value) {
            isValid = true;
            captureType = "Pair Capture";
            captureDetails = `Matching ${slot0Cards[0].card.value}'s.`;
          }
        }
        captureTypeMessage = `${captureType}${isValid ? '' : ' (Invalid)'}: ${captureDetails || 'Sum must match Principal Match value.'}`;
      } else {
        captureTypeMessage = "Invalid: Both areas must have cards, with at least one hand and one board card involved.";
      }

      if (isValid) {
        slot0El.classList.add('valid-combo');
        slot1El.classList.add('valid-combo');
      } else {
        slot0El.classList.remove('valid-combo');
        slot1El.classList.remove('valid-combo');
      }

      slot0El.addEventListener('dragover', (e) => e.preventDefault());
      slot0El.addEventListener('drop', (e) => handleDrop(e, 0));
      slot0El.addEventListener('touchend', (e) => handleTouchDrop(e, 'combo', 0));
      slot1El.addEventListener('dragover', (e) => e.preventDefault());
      slot1El.addEventListener('drop', (e) => handleDrop(e, 1));
      slot1El.addEventListener('touchend', (e) => handleTouchDrop(e, 'combo', 1));
    }
  }

  // Update capture type display
  const captureTypeEl = document.getElementById('capture-type');
  if (captureTypeEl) {
    captureTypeEl.textContent = captureTypeMessage;
  }

  const boardEl = document.getElementById('board');
  if (boardEl) {
    boardEl.innerHTML = '';
    
    if (state.board && Array.isArray(state.board)) {
      state.board.forEach((card, index) => {
        const isInPlayArea = state.combination[0].some(entry => entry.source === 'board' && entry.index === index) ||
                            state.combination[1].some(entry => entry.source === 'board' && entry.index === index);
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
      
      if (!card || !card.value || !card.suit || state.combination[0].some(entry => entry.source === 'hand' && entry.index === index) || state.combination[1].some(entry => entry.source === 'hand' && entry.index === index)) {
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
    submitBtn.disabled = !(state.currentPlayer === 0 && state.combination[0].length > 0 && state.combination[1].length === 1);
  }

  const messageEl = document.getElementById('message');
  if (messageEl) {
    if (state.currentPlayer === 0) {
      if (state.hands[0] && state.hands[0].length === 0) {
        messageEl.textContent = "You're out of cards! Waiting for bots to finish the round.";
        state.currentPlayer = 1;
        setTimeout(aiTurn, 1000);
      } else if (state.combination[0].length === 0 && state.combination[1].length === 0) {
        messageEl.textContent = "Drag or tap cards to the play areas to capture, or place a card on the board to end your turn.";
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
    state.combination = { 0: [], 1: [] };
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

// Handle place drop on board
function handlePlaceDrop(e) {
  e.preventDefault();
  if (state.currentPlayer !== 0 || !state.draggedCard) return;

  if (state.draggedCard.source !== 'hand') return;

  const handCard = state.draggedCard.card;
  const handIndex = state.draggedCard.index;

  state.board.push(handCard);
  state.hands[0] = state.hands[0].filter((_, i) => i !== handIndex);
  state.combination = { 0: [], 1: [] };
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

  // Restore cards to original positions
  state.combination[0].forEach(entry => {
    if (entry.source === 'hand' && state.hands[0][entry.index]) {
      state.hands[0][entry.index] = entry.card;
    } else if (entry.source === 'board' && state.board[entry.index]) {
      state.board[entry.index] = entry.card;
    }
  });
  state.combination[1].forEach(entry => {
    if (entry.source === 'hand' && state.hands[0][entry.index]) {
      state.hands[0][entry.index] = entry.card;
    } else if (entry.source === 'board' && state.board[entry.index]) {
      state.board[entry.index] = entry.card;
    }
  });

  state.combination = { 0: [], 1: [] };
  render();
}

// Handle submit action
function handleSubmit() {
  if (state.currentPlayer !== 0 || (state.combination[0].length === 0 && state.combination[1].length === 0)) return;

  const slot0Cards = state.combination[0];
  const slot1Cards = state.combination[1];
  const messageEl = document.getElementById('message');

  if (slot0Cards.length === 0 || slot1Cards.length === 0) {
    if (messageEl) messageEl.textContent = "Invalid combination! Both play areas must have cards.";
    return;
  }

  const hasHandCard = slot0Cards.some(entry => entry.source === 'hand') || slot1Cards.some(entry => entry.source === 'hand');
  const hasBoardCard = slot0Cards.some(entry => entry.source === 'board') || slot1Cards.some(entry => entry.source === 'board');
  if (!hasHandCard || !hasBoardCard) {
    if (messageEl) messageEl.textContent = "Invalid combination! Requires at least one hand card and one board card.";
    return;
  }

  const principalValue = parseInt(slot1Cards[0].card.value) || (window.valueMap && window.valueMap[slot1Cards[0].card.value]) || 1;
  const sumValues = slot0Cards.map(entry => parseInt(entry.card.value) || (window.valueMap && window.valueMap[entry.card.value]) || 1);
  const totalSum = sumValues.reduce((a, b) => a + b, 0);

  let isValid = false;
  let capturedCards = [...slot0Cards.map(entry => entry.card), ...slot1Cards.map(entry => entry.card)];

  if (totalSum === principalValue) {
    isValid = true;
  } else if (slot0Cards.length === 1 && slot1Cards.length === 1 && slot0Cards[0].card.value === slot1Cards[0].card.value) {
    isValid = true;
  }

  if (!isValid) {
    if (messageEl) messageEl.textContent = `Invalid capture! Sum ${totalSum} does not match Principal Match ${principalValue}.`;
    return;
  }

  // Remove captured cards from board and hand
  state.board = state.board.filter((_, i) => 
    !slot0Cards.some(entry => entry.source === 'board' && entry.index === i) &&
    !slot1Cards.some(entry => entry.source === 'board' && entry.index === i)
  );
  
  slot0Cards.forEach(entry => {
    if (entry.source === 'hand') {
      state.hands[0][entry.index] = null;
    }
  });
  slot1Cards.forEach(entry => {
    if (entry.source === 'hand') {
      state.hands[0][entry.index] = null;
    }
  });
  
  // Clean up null entries in hand
  state.hands[0] = state.hands[0].filter(card => card !== null);

  // Use global scoreCards function
  const scoreFunction = window.scoreCards || function(cards) { 
    return cards.length * 5; // Fallback scoring
  };
  state.scores.player += scoreFunction(capturedCards);
  state.combination = { 0: [], 1: [] };

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

// AI turn - CORRECTED VERSION
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
      // Simple AI capture logic
      const handCard = aiAction.handCard;
      const handIndex = state.hands[playerIndex].findIndex(card => card.id === handCard.id);
      
      // Find a simple capture (pair or sum)
      let captureFound = false;
      
      // Try pair capture first
      for (let i = 0; i < state.board.length; i++) {
        if (state.board[i].value === handCard.value) {
          // Set up pair capture
          state.combination[0] = [{ source: 'board', index: i, card: state.board[i] }];
          state.combination[1] = [{ source: 'hand', index: handIndex, card: handCard }];
          captureFound = true;
          break;
        }
      }
      
      if (captureFound) {
        render();
        if (messageEl) messageEl.textContent = `Bot ${playerIndex} is capturing...`;

        setTimeout(() => {
          const capturedCards = [...state.combination[0].map(c => c.card), ...state.combination[1].map(c => c.card)];
          
          // Remove from board
          state.board = state.board.filter((_, i) => 
            !state.combination[0].some(entry => entry.source === 'board' && entry.index === i) &&
            !state.combination[1].some(entry => entry.source === 'board' && entry.index === i)
          );
          
          // Remove from hand
          state.hands[playerIndex] = state.hands[playerIndex].filter(card => card.id !== handCard.id);
          
          // Score
          const scoreFunction = window.scoreCards || function(cards) { return cards.length * 5; };
          state.scores[playerIndex === 1 ? 'bot1' : 'bot2'] += scoreFunction(capturedCards);
          state.combination = { 0: [], 1: [] };
          
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
          playSound('capture');
          if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
        }, 1500);
      } else {
        // No capture found, place card instead
        aiAction.action = 'place';
      }
    }
    
    if (aiAction.action === 'place') {
      if (messageEl) messageEl.textContent = `Bot ${playerIndex} is placing a card...`;
      setTimeout(() => {
        const handCard = aiAction.handCard || state.hands[playerIndex][0];
        state.board.push(handCard);
        state.hands[playerIndex] = state.hands[playerIndex].filter(c => c.id !== handCard.id);
        state.combination = { 0: [], 1: [] };

        state.currentPlayer = (playerIndex + 1) % 3;
        checkGameEnd();
        render();
        playSound('place');
        if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
      }, 1500);
    }
  }, 1000);
}