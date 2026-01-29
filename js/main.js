let game = null;
let ui = null;
let botModal = null;
let modeSelector = null;

const gameStateManager = window.gameStateManager;

let botTurnInProgress = false;

function initGameSystems() {
  modeSelector = new ModeSelector();
  modeSelector.registerMode('classic', ClassicMode);
  modeSelector.registerMode('speed', SpeedMode);

  game = new GameEngine();
  ui = new UISystem(game);
  botModal = new BotModalInterface(game, ui);
}

function startGame(modeName = 'classic', settings = {}) {
  const selectedMode = modeSelector.getSelectedModeObject() || ClassicMode;
  const modeSettings = modeSelector.getSelectedModeSettings();
  Object.assign(settings, modeSettings);

  game.initGame(selectedMode, settings);
  ui.render();

}

function initGame() {
  if (window.cardIntelligence) {
    window.cardIntelligence.reset();
  }

initGameSystems();


  const storedDifficulty = localStorage.getItem('selectedDifficulty') || 'intermediate';
  const storedMode = localStorage.getItem('selectedMode');

  if (storedMode && modeSelector.availableModes[storedMode]) {
    modeSelector.currentMode = storedMode;
  }

  const gameSettings = {
    botDifficulty: storedDifficulty,
    cardSpeed: 'fast',
    soundEffects: 'on',
    targetScore: 500
  };

  startGame(modeSelector.currentMode || 'classic', gameSettings);

if (game.state.currentPlayer !== 0) {
setTimeout(() => scheduleNextBotTurn(), 1000);
}

localStorage.removeItem('selectedDifficulty');
localStorage.removeItem('selectedMode');
}

function handleSubmit() {
  if (game.state.currentPlayer !== 0) return;

  const baseCards = game.state.combination.base;

  if (baseCards.length !== 1) {

    window.messageController.handleGameEvent('CAPTURE_ERROR', {
      message: "Base Card area must have exactly one card!"
    });
    playSound('invalid');
    return;
  }

  const baseCard = baseCards[0];
  const baseValue = parseInt(baseCard.card.value) || (window.valueMap && window.valueMap[baseCard.card.value]) || 1;

  let validCaptures = [];
  let allCapturedCards = [baseCard.card];

  const captureAreas = [
    { name: 'sum1', cards: game.state.combination.sum1 },
    { name: 'sum2', cards: game.state.combination.sum2 },
    { name: 'sum3', cards: game.state.combination.sum3 }
  ];

  for (const area of captureAreas) {
    if (area.cards.length > 0) {
      const result = game.validateCapture(area.cards, baseValue, baseCard, area.name);

      if (result.isValid) {
        validCaptures.push({ name: area.name, cards: area.cards });
        allCapturedCards.push(...area.cards.map(entry => entry.card));
      } else {
        const areaNames = {
          'sum1': 'Combo 1',
          'sum2': 'Combo 2',
          'sum3': 'Combo 3'
        };

        window.messageController.handleGameEvent('CAPTURE_ERROR', {
          message: `${areaNames[area.name]}: ${result.details}`
        });
        playSound('invalid');
        return;
      }
    }
  }

  if (validCaptures.length === 0) {

    window.messageController.handleGameEvent('CAPTURE_ERROR', {
      message: "No valid captures found - check your combinations!"
    });
    playSound('invalid');
    return;
  }

  game.executeCapture(baseCard, validCaptures, allCapturedCards);
window.cardIntelligence.updateCardsSeen(allCapturedCards);

game.state.lastAction = 'capture';
if (game.currentMode.onCapture) {
    game.currentMode.onCapture(game, allCapturedCards);
  }


  const points = game.calculateScore(allCapturedCards);
  showLastCapture('Player', allCapturedCards, points);
  window.messageController.handleGameEvent('CAPTURE_SUCCESS', {
    points: points,
    cardsCount: allCapturedCards.length
  });

  game.state.combination = { base: [], sum1: [], sum2: [], sum3: [] };

    ui.render();
  playSound('capture');


  const result = window.gameStateManager.determineGameState(game);
  handleGameStateResult(result);
}

function handleResetPlayArea() {
  if (game.state.currentPlayer !== 0) return;

  Object.values(game.state.combination).flat().forEach(entry => {
    if (entry.source === 'hand' && game.state.hands[0][entry.index]) {
      game.state.hands[0][entry.index] = entry.card;
    } else if (entry.source === 'board' && game.state.board[entry.index]) {
      game.state.board[entry.index] = entry.card;
    }
  });

  game.state.combination = { base: [], sum1: [], sum2: [], sum3: [] };


  window.messageController.handleGameEvent('RESET_COMBO');

  ui.render();
}

function handleBoardDrop(e) {
  e.preventDefault();
  if (game.state.currentPlayer !== 0 || !game.state.draggedCard) return;

  if (game.state.draggedCard.slot !== undefined) {
    game.state.combination[game.state.draggedCard.slot] = game.state.combination[game.state.draggedCard.slot].filter((_, i) => i !== game.state.draggedCard.comboIndex);

    if (game.state.draggedCard.source === 'hand') {
      game.state.hands[0][game.state.draggedCard.index] = game.state.draggedCard.card;
    }

    game.state.draggedCard = null;
    ui.render();

    window.messageController.handleGameEvent('RESET_COMBO');
    return;
  }

  if (game.state.draggedCard.source !== 'hand') return;

  const handCard = game.state.draggedCard.card;
  const handIndex = game.state.draggedCard.index;

  try {
    const actualCard = game.state.hands[0][handIndex];
    if (!actualCard || actualCard.id !== handCard.id) {
      game.state.draggedCard = null;
      ui.render();
      return;
    }

    game.state.hands[0].splice(handIndex, 1);
    game.state.board.push(handCard);
    window.cardIntelligence.updateCardsSeen([handCard]);
    game.state.combination = { base: [], sum1: [], sum2: [], sum3: [] };
    game.state.draggedCard = null;

  game.state.lastAction = 'place';
  playSound('capture');

    window.messageController.handleGameEvent('CARD_PLACED', {
      cardName: `${handCard.value}${handCard.suit}`
    });

        ui.render();


    const gs = window.gameStateManager.determineGameState(game);
    handleGameStateResult(gs);


  } catch (error) {
game.state.draggedCard = null;
    ui.render();
  }
}

function checkGameEnd() {

  const result = window.gameStateManager.determineGameState(game);

  switch(result.state) {
    case 'CONTINUE_TURN':
      handleContinueTurn(result);
      break;

    case 'DEAL_NEW_HAND':
      handleDealNewHand(result);
      break;

    case 'END_ROUND':
      handleEndRound(result);
      break;

    case 'END_GAME':
      handleEndGame(result);
      break;

    case 'ERROR':
      handleGameStateError(result);
      break;

    default:
handleGameStateError({
        data: {
          message: `Unknown game state: ${result.state}`,
          userMessage: 'Game encountered an unknown state. Please restart.',
          technicalDetails: JSON.stringify(result, null, 2)
        }
      });
  }
}

async function aiTurn() {

  if (botTurnInProgress) {
return;
  }


  if (game.state.currentPlayer === 0) {
return;
  }

  const playerIndex = game.state.currentPlayer;


    if (!game.state.hands[playerIndex] || game.state.hands[playerIndex].length === 0) {
ui.render();
    const gs = window.gameStateManager.determineGameState(game);
    handleGameStateResult(gs);
    return;
  }


  botTurnInProgress = true;

  try {

    const move = aiMove(game.state.hands[playerIndex], game.state.board, game.state.settings.botDifficulty);

    let result;

    if (move && move.action === 'capture') {
result = await botModal.executeCapture(move, playerIndex);
    } else {
      const cardToPlace = move ? move.handCard : game.state.hands[playerIndex][0];
result = await botModal.placeCard(cardToPlace, playerIndex);
    }


    botTurnInProgress = false;

    if (result.success) {
if (result.action === 'capture') {

        if (window.messageController && move && move.capture) {
          const capturedCards = [move.handCard, ...move.capture.targets];
          const actualPoints = game.calculateScore(capturedCards);
          const playerNames = ['Player', 'Bot 1', 'Bot 2'];
          showLastCapture(playerNames[playerIndex], capturedCards, actualPoints);
          window.messageController.handleGameEvent('CAPTURE_SUCCESS', {
            points: actualPoints,
            cardsCount: capturedCards.length
          });
        }


        const remainingCards = game.state.hands[playerIndex].length;

        const gs = window.gameStateManager.determineGameState(game);
        handleGameStateResult(gs);

      } else if (result.action === 'place') {

        ui.render();
        const gs = window.gameStateManager.determineGameState(game);
        handleGameStateResult(gs);

      }
    } else {

      const fallbackCard = game.state.hands[playerIndex][0];
      if (fallbackCard) {
result = await botModal.placeCard(fallbackCard, playerIndex);
        if (result.success) {
          ui.render();
          const gs = window.gameStateManager.determineGameState(game);
          handleGameStateResult(gs);
        }

      }
    }

  } catch (error) {

    botTurnInProgress = false;

    game.nextPlayer();
    ui.render();
  }
}

async function scheduleNextBotTurn() {

  if (botTurnInProgress) {
return;
  }


  if (game.state.currentPlayer === 0) {
return;
  }

setTimeout(async () => {
await aiTurn();
  }, 3000);
}

function showLastCapture(playerName, cards, points) {
  const suitSymbols = { Hearts: '\u2665', Diamonds: '\u2666', Clubs: '\u2663', Spades: '\u2660' };
  const el = document.getElementById('last-capture-display');
  if (!el) return;

  const cardStr = cards.map(c => c.value + (suitSymbols[c.suit] || '')).join(' + ');
  el.innerHTML = '<span class="capture-label">Last Capture</span>' +
    '<span class="capture-detail">' + playerName + ': ' + cardStr + ' (' + points + ' pts)</span>';
  el.classList.add('visible');
}

function playSound(type) {
  if (game && game.state && game.state.settings && game.state.settings.soundEffects !== 'on') return;
  if (window.sounds && window.sounds[type]) {
    window.sounds[type].currentTime = 0;
    window.sounds[type].play().catch(e => {
      console.warn('Sound play failed:', type, e.message);
    });
  } else {
    console.warn('Sound not found:', type, '| sounds loaded:', !!window.sounds);
  }
}

function toggleSound() {
  if (!game || !game.state || !game.state.settings) return;
  const s = game.state.settings;
  s.soundEffects = s.soundEffects === 'on' ? 'off' : 'on';
  const btn = document.getElementById('sound-toggle-btn');
  if (btn) btn.textContent = s.soundEffects === 'on' ? '🔊' : '🔇';
}

function handleDragStart(e, source, index) {
  if (window.gameIsPaused || (ui && ui.modalManager && ui.modalManager.isModalActive())) {
    e.preventDefault();
    return;
  }

  if (game.state.currentPlayer !== 0) {
    return;
  }
  
  game.state.draggedCard = {
    source,
    index,
    card: source === 'hand' ? game.state.hands[0][index] : game.state.board[index]
  };
  e.target.classList.add('selected');
}

function handleDragStartCombo(e, slot, comboIndex) {
  if (game.state.currentPlayer !== 0) return;
  game.state.draggedCard = game.state.combination[slot][comboIndex];
  game.state.draggedCard.slot = slot;
  game.state.draggedCard.comboIndex = comboIndex;
  e.target.classList.add('selected');
}

function handleDragEnd(e) {
  e.target.classList.remove('selected');
  game.state.draggedCard = null;
}

function handleDrop(e, slot) {
  e.preventDefault();

  if (window.gameIsPaused || (ui && ui.modalManager && ui.modalManager.isModalActive())) {
    return;
  }

  if (game.state.currentPlayer !== 0) {
    return;
  }

  if (!game.state.draggedCard) {
    return;
  }

  if (game.state.draggedCard.slot !== undefined) {
    game.state.combination[game.state.draggedCard.slot] = game.state.combination[game.state.draggedCard.slot].filter((_, i) => i !== game.state.draggedCard.comboIndex);
  }

  if (slot === 'base' && game.state.combination.base.length > 0) {
    const existingBase = game.state.combination.base[0];
    game.state.combination.base = [];
    if (game.state.combination.sum1.length === 0) {
      game.state.combination.sum1.push(existingBase);
    } else if (game.state.combination.sum2.length === 0) {
      game.state.combination.sum2.push(existingBase);
    } else if (game.state.combination.sum3.length === 0) {
      game.state.combination.sum3.push(existingBase);
    }
  }


  const cardBeingDropped = game.state.draggedCard.card;
  const sourceType = game.state.draggedCard.source;


const currentPlayer = game.state.currentPlayer;
game.state.combination[slot].push({
  source: game.state.draggedCard.source,
  index: game.state.draggedCard.index,
  card: game.state.draggedCard.card,
  playerSource: currentPlayer,
  fromBot: currentPlayer !== 0
});

game.state.draggedCard = null;


  if (window.messageController && window.messageController.educationalMode) {
    const suitSymbols = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
    const cardName = `${cardBeingDropped.value}${suitSymbols[cardBeingDropped.suit]}`;

    window.messageController.handleGameEvent('CARD_ADDED_TO_COMBO', {
      slot: slot,
      cardName: cardName,
      card: cardBeingDropped,
      source: sourceType
    });
  }

  ui.render();
}

function handleDropOriginal(e, source, index) {
  e.preventDefault();


  if (game.state.currentPlayer !== 0) {
return;
  }

  if (!game.state.draggedCard) return;

  if (game.state.draggedCard.slot !== undefined) {
    const originalSlot = game.state.draggedCard.slot;
    game.state.combination[originalSlot] = game.state.combination[originalSlot].filter((_, i) => i !== game.state.draggedCard.comboIndex);
    game.state.draggedCard = null;
    ui.render();
  }
}

// 📱 WORKING TOUCH EVENT HANDLERS
let touchDragData = null;
let touchStartPosition = null;

function handleTouchStart(e, source, data) {
  if (game.state.currentPlayer !== 0) return;
  e.preventDefault();
  
  // Store what we're dragging
  if (source === 'hand') {
    touchDragData = {
      type: 'hand',
      index: data,
      card: game.state.hands[0][data]
    };
  } else if (source === 'board') {
    touchDragData = {
      type: 'board', 
      index: data,
      card: game.state.board[data]
    };
  } else if (source === 'combo') {
    touchDragData = {
      type: 'combo',
      slot: data.slot,
      comboIndex: data.comboIndex,
      card: game.state.combination[data.slot][data.comboIndex]
    };
  }
  
  // Store touch position
  touchStartPosition = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY
  };
  
  debugLog('GAME_FLOW', '🎯 TOUCH START:', touchDragData);
}

function handleTouchEnd(e) {
  if (game.state.currentPlayer !== 0) return;
  e.preventDefault();

  if (!touchDragData || !touchStartPosition) {
    return;
  }

  // Get touch end position
  const touchEndPosition = {
    x: e.changedTouches[0].clientX,
    y: e.changedTouches[0].clientY
  };

  // Find what element we're over
  const elementBelow = document.elementFromPoint(
    touchEndPosition.x,
    touchEndPosition.y
  );

  if (!elementBelow) {
    touchDragData = null;
    return;
  }

  // ✅ CHECK FOR COMBO AREAS FIRST
  const comboArea = elementBelow.closest('.base-area, .sum-area') ||
                   elementBelow.closest('[data-slot]') ||
                   (elementBelow.hasAttribute('data-slot') ? elementBelow : null);

  if (comboArea) {
    const slotName = comboArea.getAttribute('data-slot');
    handleTouchDropOnCombo(slotName);
  }
  // ✅ NEW: CHECK FOR BOARD DROP
  else if (elementBelow.closest('.board') || elementBelow.classList.contains('board')) {
    handleTouchDropOnBoard();
  }
  
  // Clear touch data
  touchDragData = null;
  touchStartPosition = null;
}

function handleTouchDropOnBoard() {
  if (!touchDragData) return;

  debugLog('GAME_FLOW', '🎯 TOUCH DROP ON BOARD:', touchDragData);

  // Simulate the board drop logic (same as handleDropOriginal for board)
  if (touchDragData.type === 'hand') {
    // Place card from hand to board
    const sourceCard = touchDragData.card;

    // Add to board
    game.state.board.push(sourceCard);

    // Remove from hand
    game.state.hands[0][touchDragData.index] = null;

    // Set last action
    game.state.lastAction = 'place';
    playSound('capture');

    debugLog('GAME_FLOW', '✅ TOUCH BOARD DROP COMPLETE');
    
    // Re-render and continue game
    ui.render();
    
    // Let GameStateManager handle what happens next
    const result = window.gameStateManager.determineGameState(game);
    handleGameStateResult(result);
  }
}

function handleTouchDropOnCombo(slotName) {
  if (!touchDragData) return;
  
  // Simulate the drag and drop logic
  if (touchDragData.type === 'combo') {
    // Remove from old combo position
    game.state.combination[touchDragData.slot] = 
      game.state.combination[touchDragData.slot].filter((_, i) => i !== touchDragData.comboIndex);
  }
  
  // Handle base area replacement logic (same as handleDrop)
  if (slotName === 'base' && game.state.combination.base.length > 0) {
    const existingBase = game.state.combination.base[0];
    game.state.combination.base = [];
    if (game.state.combination.sum1.length === 0) {
      game.state.combination.sum1.push(existingBase);
    } else if (game.state.combination.sum2.length === 0) {
      game.state.combination.sum2.push(existingBase);
    } else if (game.state.combination.sum3.length === 0) {
      game.state.combination.sum3.push(existingBase);
    }
  }
  
  // Add to new position
  const cardEntry = {
    card: touchDragData.card,
    source: touchDragData.type === 'combo' ? touchDragData.card.source : touchDragData.type,
    index: touchDragData.type === 'combo' ? touchDragData.card.index : touchDragData.index,
    playerSource: 0
  };
  
  game.state.combination[slotName].push(cardEntry);
  
  // Re-render the UI
  ui.render();
  
  debugLog('GAME_FLOW', '✅ TOUCH DROP COMPLETE');
}

function handleTouchDrop(e, targetType, data) {
  e.preventDefault();
  // This function can stay simple since handleTouchEnd handles the logic
  debugLog('GAME_FLOW', '🎯 TOUCH DROP EVENT:', targetType, data);
}

function provideHint() {
  if (game.state.currentPlayer !== 0) {
return;
  }


  if (!window.hintSystem) {
    window.hintSystem = new HintSystem(game, ui);
  }


  window.hintSystem.showHint();
}

document.addEventListener('DOMContentLoaded', () => {
  // 🔥 FIX: Try multiple possible button selectors to match your HTML
  
  // Submit button - try both status bar and combo area buttons
  const submitBtn = document.getElementById('submit-btn') 
    || document.getElementById('submit-move-btn');
  
  // Reset button - try both possible IDs
  const resetBtn = document.getElementById('reset-play-area-btn') 
    || document.getElementById('reset-btn');
    
  // Hint button
  const hintBtn = document.getElementById('hint-btn');

  // Attach event listeners
  if (submitBtn) {
    submitBtn.addEventListener('click', handleSubmit);
  } else {
    console.error('❌ Submit button not found!');
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', handleResetPlayArea);
  } else {
    console.error('❌ Reset button not found!');
  }

  if (hintBtn) {
    hintBtn.addEventListener('click', provideHint);
  } else {
    console.error('❌ Hint button not found!');
  }
});

window.handleDragStart = handleDragStart;
window.handleDragStartCombo = handleDragStartCombo;
window.handleDragEnd = handleDragEnd;
window.handleDrop = handleDrop;
window.handleDropOriginal = handleDropOriginal;
window.handleBoardDrop = handleBoardDrop;
window.handleTouchStart = handleTouchStart;
window.handleTouchEnd = handleTouchEnd;
window.handleTouchDrop = handleTouchDrop;

window.DraggableModal = DraggableModal;

function handleContinueTurn(result) {
  const playerIndex = result.data.playerIndex;
game.state.currentPlayer = playerIndex;
  ui.render();

  if (playerIndex !== 0) {

    setTimeout(() => aiTurn(), 1000);
  } else {
    window.messageController.handleGameEvent('TURN_START');
  }
}

function handleDealNewHand(result) {
try {
    playSound('capture');

    const dealResult = dealCards(game.state.deck, 3, 4, 0);
    game.state.hands = dealResult.players;
    game.state.deck = dealResult.remainingDeck;


    game.state.currentPlayer = result.data.startingPlayer;
    game.state.lastCapturer = null;

window.messageController.handleGameEvent('NEW_HAND', {
  handNumber: Math.floor((52 - game.state.deck.length) / 12),
  roundNumber: game.currentRound
});


    ui.render();


    if (result.data.startingPlayer !== 0) {
setTimeout(() => scheduleNextBotTurn(), 1000);
    }

  } catch (error) {
window.messageController.handleGameEvent('CAPTURE_ERROR', {
      message: 'Error dealing new hand! Please restart the game.'
    });
  }
}

function handleEndRound(result) {

  if (result.data.jackpot.hasJackpot) {
    playSound('jackpot');
    const jackpot = result.data.jackpot;
    game.addScore(jackpot.winner, jackpot.points);
    game.addOverallScore(jackpot.winner, jackpot.points);


    game.state.board = [];
  }


  if (game.currentMode.onRoundEnd) {
    game.currentMode.onRoundEnd(game);
  }


  ui.showModal('round_end', result.data);


}

function resumeNextRound(roundData) {

  game.state.deck = shuffleDeck(createDeck());

  const newStartingPlayer = (roundData.newDealer + 1) % 3;
  game.state.currentPlayer = newStartingPlayer;


  const dealResult = dealCards(game.state.deck, 3, 4, 4);
  game.state.hands = dealResult.players;
  game.state.deck = dealResult.remainingDeck;
  game.state.board = dealResult.board;

  game.currentRound = roundData.newRound;
  game.currentDealer = roundData.newDealer;

  ui.render();


  if (newStartingPlayer !== 0) {
setTimeout(() => scheduleNextBotTurn(), 1000);
  }
}

function handleEndGame(result) {

  if (result.data.jackpot.hasJackpot) {
    playSound('jackpot');
    const jackpot = result.data.jackpot;
    game.addScore(jackpot.winner, jackpot.points);
    game.addOverallScore(jackpot.winner, jackpot.points);


    game.state.board = [];
  }

  playSound('winner');

  if (game.currentMode.onGameEnd) {
    game.currentMode.onGameEnd(game);
  }


  ui.showModal('game_over', result.data);


  ui.render();
}

function handleGameStateError(result) {
console.error(` TECHNICAL DETAILS:`, result.data.technicalDetails);


  ui.showModal('error', result.data);


  window.messageController.handleGameEvent('CAPTURE_ERROR', {
    message: result.data.userMessage
  });
}

window.resumeNextRound = resumeNextRound;
window.toggleSound = toggleSound;

initGame();

function handleGameStateResult(result) {
switch(result.state) {
    case gameStateManager.STATES.CONTINUE_TURN:
      handleContinueTurn(result);
      break;

    case gameStateManager.STATES.DEAL_NEW_HAND:
      handleDealNewHand(result);
      break;

    case gameStateManager.STATES.END_ROUND:
      handleEndRound(result);
      break;

    case gameStateManager.STATES.END_GAME:
      handleEndGame(result);
      break;

    case gameStateManager.STATES.ERROR:
      handleGameStateError(result);
      break;

    default:
}
}

window.gameIsPaused = false;
