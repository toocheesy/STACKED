/* 
 * STACKED! - Main Game Controller
 * 🔥 FIXED: Jackpot message bug + Card disappearing during bot turns
 */

// Global game instance
let game = null;
let ui = null;
let botModal = null;
let modeSelector = null;

// Initialize game systems
function initGameSystems() {
  modeSelector = new ModeSelector();
  modeSelector.registerMode('classic', ClassicMode);
  modeSelector.registerMode('speed', SpeedMode);
  
  game = new GameEngine();
  ui = new UISystem(game);
  botModal = new BotModalInterface(game, ui);
}

// Start a new game with specified mode
function startGame(modeName = 'classic', settings = {}) {
  const selectedMode = modeSelector.getSelectedModeObject() || ClassicMode;
  const modeSettings = modeSelector.getSelectedModeSettings();
  Object.assign(settings, modeSettings);
  
  game.initGame(selectedMode, settings);
  ui.render();
  
  console.log(`🎮 ${selectedMode.name} started with ${settings.botDifficulty} AI`);
}

// Main initialization
function initGame() {
  if (window.cardIntelligence) {
    window.cardIntelligence.reset();
  }
  
  initGameSystems();
  
  // Read homepage selections
  const storedDifficulty = localStorage.getItem('selectedDifficulty') || 'intermediate';
  const storedMode = localStorage.getItem('selectedMode');
  
  if (storedMode && modeSelector.availableModes[storedMode]) {
    modeSelector.currentMode = storedMode;
  }
  
  const gameSettings = {
    botDifficulty: storedDifficulty,
    cardSpeed: 'fast',
    soundEffects: 'off', 
    targetScore: 500
  };
  
  startGame(modeSelector.currentMode || 'classic', gameSettings);
  
  // Clear localStorage after game starts
  localStorage.removeItem('selectedDifficulty');
  localStorage.removeItem('selectedMode');
}

// 🎯 UPDATED handleSubmit() WITH MESSAGE EVENTS
function handleSubmit() {
  if (game.state.currentPlayer !== 0) return;

  const baseCards = game.state.combination.base;

  if (baseCards.length !== 1) {
    // 🎯 SEND ERROR EVENT TO MESSAGE CONTROLLER
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
    { name: 'sum3', cards: game.state.combination.sum3 },
    { name: 'match', cards: game.state.combination.match }
  ];

  for (const area of captureAreas) {
    if (area.cards.length > 0) {
      const result = game.validateCapture(area.cards, baseValue, baseCard, area.name);

      if (result.isValid) {
        validCaptures.push({ name: area.name, cards: area.cards });
        allCapturedCards.push(...area.cards.map(entry => entry.card));
      } else {
        const areaNames = {
          'sum1': 'Sum Area 1',
          'sum2': 'Sum Area 2', 
          'sum3': 'Sum Area 3',
          'match': 'Match Area'
        };
        // 🎯 SEND ERROR EVENT TO MESSAGE CONTROLLER
        window.messageController.handleGameEvent('CAPTURE_ERROR', {
          message: `${areaNames[area.name]}: ${result.details}`
        });
        playSound('invalid');
        return;
      }
    }
  }

  if (validCaptures.length === 0) {
    // 🎯 SEND ERROR EVENT TO MESSAGE CONTROLLER
    window.messageController.handleGameEvent('CAPTURE_ERROR', {
      message: "No valid captures found - check your combinations!"
    });
    playSound('invalid');
    return;
  }

  game.executeCapture(baseCard, validCaptures, allCapturedCards);
  window.cardIntelligence.updateCardsSeen(allCapturedCards);
    
  if (game.currentMode.onCapture) {
    game.currentMode.onCapture(game, allCapturedCards);
  }
  
  // 🎯 SEND SUCCESS EVENT TO MESSAGE CONTROLLER
  const points = game.calculateScore(allCapturedCards);
  window.messageController.handleGameEvent('CAPTURE_SUCCESS', {
    points: points,
    cardsCount: allCapturedCards.length
  });
  
  game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };

  if (game.state.hands[0].length > 0) {
    game.state.currentPlayer = 0;
    // 🎯 SEND TURN START EVENT
    window.messageController.handleGameEvent('TURN_START');
  } else {
    game.state.currentPlayer = 1;
    // 🎯 SEND PLAYER OUT OF CARDS EVENT
    window.messageController.handleGameEvent('PLAYER_OUT_OF_CARDS');
    setTimeout(async () => await aiTurn(), 1000);
  }
  
  ui.render();
  playSound('capture');
  checkGameEnd();
}

// 🎯 UPDATED handleResetPlayArea() WITH MESSAGE EVENTS
function handleResetPlayArea() {
  if (game.state.currentPlayer !== 0) return;

  Object.values(game.state.combination).flat().forEach(entry => {
    if (entry.source === 'hand' && game.state.hands[0][entry.index]) {
      game.state.hands[0][entry.index] = entry.card;
    } else if (entry.source === 'board' && game.state.board[entry.index]) {
      game.state.board[entry.index] = entry.card;
    }
  });

  game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
  
  // 🎯 SEND RESET EVENT TO MESSAGE CONTROLLER
  window.messageController.handleGameEvent('RESET_COMBO');
  
  ui.render();
}

// 🎯 UPDATED handleBoardDrop() WITH CARD PLACED EVENT
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
    // 🎯 SEND CARD RETURNED EVENT
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
    game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
    game.state.draggedCard = null;
    
    // 🎯 SEND CARD PLACED EVENT TO MESSAGE CONTROLLER
    window.messageController.handleGameEvent('CARD_PLACED', {
      cardName: `${handCard.value}${handCard.suit}`
    });
    
    const playerCards = game.state.hands[0].length;
    if (playerCards > 0) {
      game.nextPlayer();
    } else {
      game.nextPlayer();
    }
    
    ui.render();
    checkGameEnd();
    
    if (game.state.currentPlayer !== 0) {
      setTimeout(async () => await scheduleNextBotTurn(), 100);
    }
    
  } catch (error) {
    console.error('Error in card placement:', error);
    game.state.draggedCard = null;
    ui.render();
  }
}

// 🔥 FIXED: checkGameEnd() - NOW PROPERLY PASSES JACKPOT MESSAGES + PREVENTS DOUBLE CALLS!
let modalAlreadyShown = false; // 🛡️ Guard against double calls

function checkGameEnd() {
  const endResult = game.checkGameEnd();
  
  console.log(`🔍 CHECK GAME END:`, endResult, `Modal shown: ${modalAlreadyShown}`);
  
  if (endResult.gameOver && !modalAlreadyShown) {
    modalAlreadyShown = true; // 🛡️ Set guard
    
    if (game.currentMode.onGameEnd) {
      game.currentMode.onGameEnd(game);
    }
    // 🔥 CRITICAL FIX: Pass the complete endResult object with message!
    showGameOverModal(endResult);
    
    // Reset guard after modal is shown
    setTimeout(() => { modalAlreadyShown = false; }, 1000);
    
  } else if (endResult.roundOver && !modalAlreadyShown) {
    modalAlreadyShown = true; // 🛡️ Set guard
    
    if (game.currentMode.onRoundEnd) {
      game.currentMode.onRoundEnd(game);
    }
    // 🔥 CRITICAL FIX: Pass the complete endResult object with message!
    showRoundEndModal(endResult);
    
    // Reset guard after modal is shown
    setTimeout(() => { modalAlreadyShown = false; }, 1000);
    
  } else if (endResult.continueRound) {
    dealNewCards();
  }
}

// 🎯 UPDATED dealNewCards() WITH MESSAGE EVENTS
function dealNewCards() {
  try {
    if (game.state.deck.length < 12) {
      checkGameEnd();
      return;
    }
    
    const dealResult = dealCards(game.state.deck, 3, 4, 0);
    game.state.hands = dealResult.players;
    game.state.deck = dealResult.remainingDeck;
    game.state.currentPlayer = 0;
    game.state.lastCapturer = null;
    
    // 🎯 SEND NEW ROUND EVENT TO MESSAGE CONTROLLER
    window.messageController.handleGameEvent('NEW_ROUND', {
      roundNumber: game.currentRound
    });
    
    ui.render();
  } catch (e) {
    console.error('Error dealing cards:', e);
    
    // 🎯 SEND ERROR EVENT TO MESSAGE CONTROLLER
    window.messageController.handleGameEvent('CAPTURE_ERROR', {
      message: 'Error dealing cards! Restart the game.'
    });
  }
}

async function aiTurn() {
  if (game.state.currentPlayer === 0) return;

  const playerIndex = game.state.currentPlayer;
  
  if (game.state.hands[playerIndex].length === 0) {
    game.nextPlayer();
    ui.render();
    
    const remainingPlayers = game.state.hands.filter((hand, idx) => hand.length > 0);
    const playersWithCards = remainingPlayers.length;
    
    if (playersWithCards === 0) {
      checkGameEnd();
      return;
    } else if (game.state.currentPlayer !== 0 && game.state.hands[game.state.currentPlayer].length > 0) {
      setTimeout(async () => await scheduleNextBotTurn(), 1000);
    } else if (game.state.currentPlayer === 0 && game.state.hands[0].length === 0) {
      let nextBot = 1;
      while (nextBot < 3 && game.state.hands[nextBot].length === 0) {
        nextBot++;
      }
      if (nextBot < 3) {
        game.state.currentPlayer = nextBot;
        setTimeout(async () => await scheduleNextBotTurn(), 1000);
      } else {
        checkGameEnd();
      }
    }
    return;
  }
  
  setTimeout(() => {
    const move = aiMove(game.state.hands[playerIndex], game.state.board, game.state.settings.botDifficulty);
    
    if (move && move.action === 'capture') {
      botModal.executeCapture(move, playerIndex);
    } else {
      botModal.placeCard(move ? move.handCard : game.state.hands[playerIndex][0], playerIndex);
    }
  }, 1000);
}

async function scheduleNextBotTurn() {
  if (game.botTurnInProgress) return;
  
  if (game.state.currentPlayer !== 0 && game.state.hands[game.state.currentPlayer] && game.state.hands[game.state.currentPlayer].length > 0) {
    game.botTurnInProgress = true;
    setTimeout(async () => {
      game.botTurnInProgress = false;
      await aiTurn();
    }, 1000);
  }
}

function playSound(type) {
  if (game.state.settings.soundEffects === 'on' && window.sounds && window.sounds[type]) {
    window.sounds[type].play().catch(e => console.error('Sound play failed:', e));
  }
}

// Drag and drop handlers
function handleDragStart(e, source, index) {
  if (game.state.currentPlayer !== 0) return;
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

// 🔥 FIXED: handleDrop() - PREVENTS INTERFERENCE DURING BOT TURNS
function handleDrop(e, slot) {
  e.preventDefault();
  
  // 🔥 CRITICAL FIX: Block ALL drag operations during bot turns
  if (game.state.currentPlayer !== 0) {
    console.log('🚨 BLOCKING DROP: Bot turn in progress');
    return;
  }
  
  if (!game.state.draggedCard) return;

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
    } else {
      game.state.combination.match.push(existingBase);
    }
  }

  // 🎓 CAPTURE CARD INFO BEFORE ADDING TO COMBO
  const cardBeingDropped = game.state.draggedCard.card;
  const sourceType = game.state.draggedCard.source;

  game.state.combination[slot].push({
    source: game.state.draggedCard.source,
    index: game.state.draggedCard.index,
    card: game.state.draggedCard.card
  });

  game.state.draggedCard = null;

  // 🎓 SEND COMBO ASSISTANCE EVENT FOR BEGINNERS
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
  
  // 🔥 CRITICAL FIX: Block during bot turns
  if (game.state.currentPlayer !== 0) {
    console.log('🚨 BLOCKING ORIGINAL DROP: Bot turn in progress');
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

function handleTouchStart(e, source, data) {
  if (game.state.currentPlayer !== 0) return;
  e.preventDefault();
}

function handleTouchEnd(e) {
  if (game.state.currentPlayer !== 0) return;
  e.preventDefault();
}

function handleTouchDrop(e, targetType, data) {
  e.preventDefault();
}

// 🎯 UPDATED provideHint() WITH MESSAGE EVENTS
function provideHint() {
  if (game.state.currentPlayer !== 0) return;
  
  const possibleCaptures = [];
  for (const [index, card] of game.state.hands[0].entries()) {
    const captures = canCapture(card, game.state.board);
    captures.forEach(capture => {
      possibleCaptures.push({ handIndex: index, capture });
    });
  }

  if (possibleCaptures.length === 0) {
    // 🎯 SEND HINT EVENT TO MESSAGE CONTROLLER
    window.messageController.handleGameEvent('HINT_REQUESTED', {
      hintText: "No valid captures available. Place a card to end your turn."
    });
    return;
  }

  const hint = possibleCaptures[Math.floor(Math.random() * possibleCaptures.length)];
  
  // 🎯 SEND HINT EVENT TO MESSAGE CONTROLLER
  window.messageController.handleGameEvent('HINT_REQUESTED', {
    hintText: "Try combining the highlighted cards!"
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  const submitBtn = document.getElementById('submit-btn');
  const restartBtn = document.getElementById('restart-btn');
  const resetBtn = document.getElementById('reset-play-area-btn');
  const hintBtn = document.getElementById('hint-btn');
  
  if (submitBtn) submitBtn.addEventListener('click', handleSubmit);
  if (restartBtn) restartBtn.addEventListener('click', initGame);
  if (resetBtn) resetBtn.addEventListener('click', handleResetPlayArea);
  if (hintBtn) hintBtn.addEventListener('click', provideHint);
});

// Make functions globally available
window.handleDragStart = handleDragStart;
window.handleDragStartCombo = handleDragStartCombo;
window.handleDragEnd = handleDragEnd;
window.handleDrop = handleDrop;
window.handleDropOriginal = handleDropOriginal;
window.handleBoardDrop = handleBoardDrop;
window.handleTouchStart = handleTouchStart;
window.handleTouchEnd = handleTouchEnd;
window.handleTouchDrop = handleTouchDrop;

// Initialize the game
initGame();