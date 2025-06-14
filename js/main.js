// main.js - Main game engine + rendering (modular version)
import { logDebug } from './debug.js';
import { handleCapture, canCapture } from './captureLogic.js';
import { manageTurn, endGame } from './turnManager.js';
import { processBotTurn, scoreCards, dealAfterBots, valueMap, pointsMap } from './gameLogic.js';
import { setupAI } from './ai.js';
import { createDeck, shuffleDeck, dealCards } from './deck.js';

// Base64-encoded audio files (shortened for brevity; use real base64 audio in production)
const sounds = {
  capture: new Audio('data:audio/mp3;base64,...'), // Replace with actual base64
  place: new Audio('data:audio/mp3;base64,...'),
  turnChange: new Audio('data:audio/mp3;base64,...'),
  gameEnd: new Audio('data:audio/mp3;base64,...')
};

const suitSymbols = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };

export function initializeGame({ playerHand, bot1Hand, bot2Hand, board, remainingDeck, aiConfig }) {
  let state = {
    deck: remainingDeck || [],
    board: board || [],
    hands: [playerHand || [], bot1Hand || [], bot2Hand || []], // Player, Bot 1, Bot 2
    scores: { player: 0, bot1: 0, bot2: 0 },
    combination: { 0: [], 1: [] }, // Slot 0: Play Area, Slot 1: Principal Match
    currentPlayer: 0,
    settings: {
      cardSpeed: 'fast',
      soundEffects: 'off',
      targetScore: 500,
      botDifficulty: aiConfig.difficulty || 'intermediate'
    },
    draggedCard: null,
    selectedCard: null
  };

  // Expose state for debug (temporary until fully modular)
  if (typeof window !== 'undefined') window.state = state;

  logDebug('Game initialized with state:', state);

  // Play sound based on settings
  function playSound(type) {
    if (state.settings.soundEffects === 'on' && sounds[type]) {
      sounds[type].play().catch(e => console.error('Sound play failed:', e));
    }
  }

  // Show settings modal with enhanced debug
  function showSettingsModal() {
    logDebug('Attempting to show settings modal');
    const modal = document.getElementById('settings-modal');
    if (modal) {
      logDebug('Modal element found:', modal);
      try {
        modal.showModal();
        logDebug('Modal opened successfully');
      } catch (e) {
        logDebug('Error opening modal:', e);
      }
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
          if (tutorialModal) tutorialModal.showModal();
        });
      }
    } else {
      logDebug('Modal element not found in DOM');
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

  // Render the game state with a fun fade-in
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
        // Render Play Area (Slot 0) with fade-in
        slot0El.innerHTML = state.combination[0].map((comboEntry, comboIndex) => `
          <div class="card ${comboEntry.card.suit === 'Hearts' || comboEntry.card.suit === 'Diamonds' ? 'red' : ''}" 
               style="position: absolute; top: ${comboIndex * 20}px; opacity: 0" 
               draggable="true" data-slot="0" data-combo-index="${comboIndex}">
            ${comboEntry.card.value}${suitSymbols[comboEntry.card.suit]}
          </div>
        `).join('');
        if (state.combination[0].length === 0) {
          slot0El.style.backgroundColor = 'rgba(241, 196, 15, 0.1)';
          slot0El.style.border = '2px dashed #ccc';
        }
        slot0El.style.height = `${110 + (state.combination[0].length - 1) * 20}px`;

        // Render Principal Match Area (Slot 1) with fade-in
        slot1El.innerHTML = state.combination[1].length > 0 ? `
          <div class="card ${state.combination[1][0].card.suit === 'Hearts' || state.combination[1][0].card.suit === 'Diamonds' ? 'red' : ''}" 
               style="position: absolute; opacity: 0" 
               draggable="true" data-slot="1" data-combo-index="0">
            ${state.combination[1][0].card.value}${suitSymbols[state.combination[1][0].card.suit]}
          </div>
        ` : '';
        if (state.combination[1].length === 0) {
          slot1El.style.backgroundColor = 'rgba(241, 196, 15, 0.1)';
          slot1El.style.border = '2px dashed #ccc';
        }
        slot1El.style.height = '110px';

        // Validation
        let isValid = false;
        let captureType = "";
        let captureDetails = "";
        if (state.combination[0].length > 0 && state.combination[1].length === 1) {
          const hasHandCard = state.combination[0].some(entry => entry.source === 'hand') || state.combination[1][0].source === 'hand';
          const hasBoardCard = state.combination[0].some(entry => entry.source === 'board') || state.combination[1][0].source === 'board';
          if (hasHandCard && hasBoardCard) {
            const principalValue = parseInt(state.combination[1][0].card.value) || (valueMap && valueMap[state.combination[1][0].card.value]) || 1;
            const sumValues = state.combination[0].map(entry => parseInt(entry.card.value) || (valueMap && valueMap[entry.card.value]) || 1);
            const totalSum = sumValues.reduce((a, b) => a + b, 0);
            if (totalSum === principalValue) {
              isValid = true;
              captureType = "Sum Capture";
              captureDetails = `${sumValues.join(' + ')} = ${principalValue}.`;
            } else if (state.combination[0].length === 1 && state.combination[0][0].card.value === state.combination[1][0].card.value) {
              isValid = true;
              captureType = "Pair Capture";
              captureDetails = `Matching ${state.combination[0][0].card.value}'s.`;
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

        // Add event listeners
        [slot0El, slot1El].forEach(el => {
          el.addEventListener('dragover', (e) => e.preventDefault());
          el.addEventListener('drop', (e) => handleDrop(e, parseInt(el.getAttribute('data-slot'))));
          el.addEventListener('touchend', (e) => handleTouchDrop(e, 'combo', parseInt(el.getAttribute('data-slot'))));
        });
      }
    }

    // Update capture type display
    const captureTypeEl = document.getElementById('capture-type');
    if (captureTypeEl) {
      captureTypeEl.textContent = captureTypeMessage;
    }

    // Render board with fade-in
    const boardEl = document.getElementById('board');
    if (boardEl) {
      boardEl.innerHTML = state.board.map((card, index) => {
        const isInPlayArea = state.combination[0].some(entry => entry.source === 'board' && entry.index === index) ||
                            state.combination[1].some(entry => entry.source === 'board' && entry.index === index);
        return isInPlayArea ? '' : `
          <div class="card ${card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : ''}" 
               style="opacity: 0" draggable="true" data-index="${index}" data-type="board">
            ${card.value}${suitSymbols[card.suit]}
          </div>
        `;
      }).join('');
      boardEl.addEventListener('dragover', (e) => e.preventDefault());
      boardEl.addEventListener('drop', handlePlaceDrop);
      boardEl.addEventListener('touchend', (e) => handleTouchDrop(e, 'board'));
    }

    // Render player hand with fade-in
    const handEl = document.getElementById('player-hand');
    if (handEl) {
      handEl.innerHTML = Array(4).fill().map((_, index) => {
        const card = state.hands[0][index];
        if (!card || state.combination[0].some(entry => entry.source === 'hand' && entry.index === index) ||
            state.combination[1].some(entry => entry.source === 'hand' && entry.index === index)) {
          return `<div class="card" style="background-color: #f0f0f0; border: 2px dashed #ccc; opacity: 0" 
                   data-index="${index}" data-type="hand"></div>`;
        }
        return `
          <div class="card ${card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : ''}" 
               style="opacity: 0" draggable="true" data-index="${index}" data-type="hand">
            ${card.value}${suitSymbols[card.suit]}
          </div>
        `;
      }).join('');
      handEl.addEventListener('dragover', (e) => e.preventDefault());
      handEl.addEventListener('drop', (e) => handleDropOriginal(e, 'hand', parseInt(e.target.getAttribute('data-index'))));
      handEl.addEventListener('touchend', (e) => handleTouchDrop(e, 'hand', parseInt(e.target.getAttribute('data-index'))));
    }

    // Render bot hands
    const bot1HandEl = document.getElementById('bot1-hand');
    if (bot1HandEl) {
      bot1HandEl.innerHTML = state.hands[1].map(() => `
        <div class="card back" style="opacity: 0"></div>
      `).join('');
    }
    const bot2HandEl = document.getElementById('bot2-hand');
    if (bot2HandEl) {
      bot2HandEl.innerHTML = state.hands[2].map(() => `
        <div class="card back" style="opacity: 0"></div>
      `).join('');
    }

    // Update scores
    const playerScoreEl = document.getElementById('player-score');
    const bot1ScoreEl = document.getElementById('bot1-score');
    const bot2ScoreEl = document.getElementById('bot2-score');
    if (playerScoreEl) playerScoreEl.textContent = `Player: ${state.scores.player} pts`;
    if (bot1ScoreEl) bot1ScoreEl.textContent = `Bot 1: ${state.scores.bot1} pts`;
    if (bot2ScoreEl) bot2ScoreEl.textContent = `Bot 2: ${state.scores.bot2} pts`;

    // Update submit button and message
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      submitBtn.disabled = !(state.currentPlayer === 0 && state.combination[0].length > 0 && state.combination[1].length === 1);
    }
    const messageEl = document.getElementById('message');
    if (messageEl) {
      if (state.currentPlayer === 0) {
        if (state.hands[0].length === 0) {
          messageEl.textContent = "You're out of cards! Bots will finish the round.";
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

    // Fade-in animation
    setTimeout(() => {
      [...slot0El.children, ...slot1El.children, ...boardEl.children, ...handEl.children, ...bot1HandEl.children, ...bot2HandEl.children].forEach(el => {
        el.style.transition = 'opacity 0.5s';
        el.style.opacity = '1';
      });
    }, 100);
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
      manageTurn(state);
      playSound('place');
      render();
      if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
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
    if (state.currentPlayer !== 0 || !state.draggedCard || state.draggedCard.source !== 'hand') return;

    const handCard = state.draggedCard.card;
    const handIndex = state.draggedCard.index;

    state.board.push(handCard);
    state.hands[0] = state.hands[0].filter((_, i) => i !== handIndex);
    state.combination = { 0: [], 1: [] };
    state.currentPlayer = 1;
    state.draggedCard = null;
    manageTurn(state);
    render();
    playSound('place');
    if (state.currentPlayer !== 0) setTimeout(aiTurn, 1000);
  }

  // Handle reset play area
  function handleResetPlayArea() {
    if (state.currentPlayer !== 0) return;

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

    const principalValue = parseInt(slot1Cards[0].card.value) || (valueMap && valueMap[slot1Cards[0].card.value]) || 1;
    const sumValues = slot0Cards.map(entry => parseInt(entry.card.value) || (valueMap && valueMap[entry.card.value]) || 1);
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

    handleCapture(state, slot0Cards, slot1Cards); // Use the imported function
    state.combination = { 0: [], 1: [] };

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

  // AI turn - Simplified to one beginner mode
  function aiTurn() {
    const playerIndex = state.currentPlayer;
    const messageEl = document.getElementById('message');

    if (state.hands[playerIndex].length === 0) {
      state.currentPlayer = (playerIndex + 1) % 3;
      manageTurn(state);
      render();
      playSound('turnChange');
      if (state.currentPlayer !== 0 && state.hands.some(hand => hand.length > 0)) {
        setTimeout(aiTurn, 1000);
      }
      return;
    }

    setTimeout(() => {
      const move = processBotTurn(state.hands[playerIndex], state.board, state.settings.botDifficulty);

      if (move.action === 'capture') {
        if (messageEl) messageEl.textContent = `Bot ${playerIndex} is capturing...`;
        const handCard = move.handCard;
        const handIndex = state.hands[playerIndex].findIndex(card => card && card.id === handCard.id);

        state.combination[0] = move.targetCards ? move.targetCards.map((card, idx) => ({
          source: 'board',
          index: state.board.findIndex(bc => bc && bc.id === card.id),
          card: state.board.find(bc => bc && bc.id === card.id) || null
        })).filter(c => c.card) : [];
        state.combination[1] = handIndex >= 0 ? [{ source: 'hand', index: handIndex, card: handCard }] : [];

        render();

        setTimeout(() => {
          const capturedCards = [...state.combination[0].map(c => c.card), ...state.combination[1].map(c => c.card)].filter(c => c);
          
          state.board = state.board.filter((_, i) => 
            !state.combination[0].some(entry => entry && entry.source === 'board' && entry.index === i) &&
            !state.combination[1].some(entry => entry && entry.source === 'board' && entry.index === i)
          );
          
          state.hands[playerIndex] = state.hands[playerIndex].filter(card => card && card.id !== handCard.id);
          
          state.scores[playerIndex === 1 ? 'bot1' : 'bot2'] += scoreCards(capturedCards);
          state.combination = { 0: [], 1: [] };

          if (state.board.length === 0 && state.hands[playerIndex].length > 0) {
            const nextCard = state.hands[playerIndex][0];
            if (nextCard && nextCard.value && nextCard.suit) {
              state.board.push(nextCard);
              state.hands[playerIndex] = state.hands[playerIndex].slice(1);
            }
          }

          state.currentPlayer = (playerIndex + 1) % 3;
          manageTurn(state);
          render();
          playSound('capture');
          if (state.currentPlayer !== 0 && state.hands.some(hand => hand.length > 0)) {
            setTimeout(aiTurn, 1000);
          }
        }, 1500);
      } else if (move.action === 'place') {
        if (messageEl) messageEl.textContent = `Bot ${playerIndex} is placing a card...`;
        const handCard = move.handCard || state.hands[playerIndex][0];
        state.board.push(handCard);
        state.hands[playerIndex] = state.hands[playerIndex].filter(c => c && c.id !== handCard.id);
        state.combination = { 0: [], 1: [] };

        state.currentPlayer = (playerIndex + 1) % 3;
        manageTurn(state);
        render();
        playSound('place');
        if (state.currentPlayer !== 0 && state.hands.some(hand => hand.length > 0)) {
          setTimeout(aiTurn, 1000);
        }
      }
    }, 1000);
  }

  // Check game end (handled by manageTurn now)
  function checkGameEnd() {
    manageTurn(state);
  }

  // Return for external access if needed
  return { render, handleSubmit, aiTurn, checkGameEnd };
}