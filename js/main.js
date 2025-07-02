/* 
 * STACKED! - Main Game Controller
 * Restructured for multiple game modes with ModeSelector
 * Handles initialization, event management, and mode coordination
 */

// Global game instance
let game = null;
let ui = null;
let botModal = null;
let modeSelector = null;

// Initialize game systems
function initGameSystems() {
  // Create mode selector
  modeSelector = new ModeSelector();
  
  // Register available modes
  modeSelector.registerMode('classic', ClassicMode);
  modeSelector.registerMode('speed', SpeedMode);
  
  // Create game engine
  game = new GameEngine();
  
  // Create UI system
  ui = new UISystem(game);
  
  // Create bot interface
  botModal = new BotModalInterface(game, ui);
  
  console.log('🎮 Game systems initialized');
}

// Start a new game with specified mode
function startGame(modeName = 'classic', settings = {}) {
  const selectedMode = modeSelector.getSelectedModeObject() || ClassicMode;
  
  // Apply mode-specific settings
  const modeSettings = modeSelector.getSelectedModeSettings();
  Object.assign(settings, modeSettings);
  
  // 🔥 CRITICAL FIX: Apply homepage settings directly - NO MODAL!
  game.initGame(selectedMode, settings);
  
  // 🔥 NEW: Initialize mode immediately with settings
  if (game.currentMode && game.currentMode.init) {
    game.currentMode.init(game);
  }
  
  ui.render();
  
  // 🚨 REMOVED: showSettingsModal() - we use homepage selections only!
  console.log(`🎮 Started ${selectedMode.name} with difficulty: ${settings.botDifficulty}`);
  console.log(`⚙️ Settings applied directly from homepage - NO MODAL OVERRIDE!`);
}

// Main initialization
function initGame() {
  // 🧠 RESET AI BRAIN FOR NEW GAME
  if (window.cardIntelligence) {
    window.cardIntelligence.reset();
    console.log('🧠 AI BRAIN RESET FOR NEW GAME');
  }
  
  initGameSystems();
  
  // 🔥 CRITICAL FIX: Read settings from localStorage FIRST 
  const storedDifficulty = localStorage.getItem('selectedDifficulty') || 'intermediate';
  const storedMode = localStorage.getItem('selectedMode');
  
  console.log(`🎯 HOMEPAGE SELECTIONS: Mode=${storedMode}, Difficulty=${storedDifficulty}`);
  
  if (storedMode && modeSelector.availableModes[storedMode]) {
    modeSelector.currentMode = storedMode;
    console.log(`🎮 Homepage selected mode: ${storedMode}`);
  }
  
  // 🔥 Apply settings immediately 
  const gameSettings = {
    botDifficulty: storedDifficulty,
    cardSpeed: 'fast',
    soundEffects: 'off', 
    targetScore: 500
  };
  
  console.log(`🎯 APPLYING BOT DIFFICULTY: ${storedDifficulty}`);
  console.log(`🚨 USING HOMEPAGE SELECTIONS ONLY!`);
  
  startGame(modeSelector.currentMode || 'classic', gameSettings);
  
  // 🔥 Clear localStorage AFTER game is started
  localStorage.removeItem('selectedDifficulty');
  localStorage.removeItem('selectedMode');
}

// Event Handlers - Now work with any game mode
function handleSubmit() {
  if (game.state.currentPlayer !== 0) return;

  const baseCards = game.state.combination.base;

  if (baseCards.length !== 1) {
    ui.smartMessages.showErrorMessage("Base Card area must have exactly one card!");
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

  // Validate captures using current mode
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
        ui.smartMessages.showErrorMessage(`${areaNames[area.name]}: ${result.details}`);
        playSound('invalid');
        return;
      }
    }
  }

  if (validCaptures.length === 0) {
    ui.smartMessages.showErrorMessage("No valid captures found - check your combinations!");
    playSound('invalid');
    return;
  }

  // Execute capture through game engine
  game.executeCapture(baseCard, validCaptures, allCapturedCards);

  // 🧠 TRACK CAPTURED CARDS FOR AI INTELLIGENCE
  window.cardIntelligence.updateCardsSeen(allCapturedCards);
    
  // Notify mode of capture
  if (game.currentMode.onCapture) {
    game.currentMode.onCapture(game, allCapturedCards);
  }
  
  // Reset combination state
  game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };

  // Handle turn continuation
  if (game.state.hands[0].length > 0) {
    game.state.currentPlayer = 0;
  } else {
    game.state.currentPlayer = 1;
    setTimeout(async () => await aiTurn(), 1000);
  }
  
  ui.render();
  playSound('capture');
  
  // Check game end condition
  checkGameEnd();
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

  game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
  ui.render();
  ui.smartMessages.updateMessage('turn_start');
}

function handleBoardDrop(e) {
  e.preventDefault();
  if (game.state.currentPlayer !== 0 || !game.state.draggedCard) return;

  // Case 1: Returning card from combo area
  if (game.state.draggedCard.slot !== undefined) {
    console.log(`🔄 RETURNING CARD: ${game.state.draggedCard.card.value}${game.state.draggedCard.card.suit} from ${game.state.draggedCard.slot}`);
    
    // Remove card from combo area
    game.state.combination[game.state.draggedCard.slot] = game.state.combination[game.state.draggedCard.slot].filter((_, i) => i !== game.state.draggedCard.comboIndex);
    
    // Smart return based on original source
    if (game.state.draggedCard.source === 'board') {
      console.log(`🔄 BOARD CARD RETURNED: Stays at original position`);
    } else if (game.state.draggedCard.source === 'hand') {
      console.log(`🔄 HAND CARD RETURNED: Going back to hand position ${game.state.draggedCard.index}`);
      game.state.hands[0][game.state.draggedCard.index] = game.state.draggedCard.card;
    }
    
    game.state.draggedCard = null;
    ui.render();
    ui.smartMessages.showSuccessMessage("Card returned to original location!");
    return;
  }

  // Case 2: Placing card from hand to end turn - FIXED VERSION
  if (game.state.draggedCard.source !== 'hand') return;

  const handCard = game.state.draggedCard.card;
  const handIndex = game.state.draggedCard.index;

  console.log(`🎴 PLAYER: PLACING ${handCard.value}${handCard.suit} on board`);

  // 🔥 BULLETPROOF CARD PLACEMENT
  try {
    // STEP 1: Remove card from player hand FIRST
    const actualCard = game.state.hands[0][handIndex];
    if (!actualCard || actualCard.id !== handCard.id) {
      console.error(`🚨 CRITICAL: Card mismatch at index ${handIndex}!`);
      game.state.draggedCard = null;
      ui.render();
      return;
    }
    
    // Remove from hand
    game.state.hands[0].splice(handIndex, 1);
    console.log(`✅ REMOVED: ${handCard.value}${handCard.suit} from player hand (${game.state.hands[0].length} cards left)`);
    
    // STEP 2: Add to board IMMEDIATELY  
    game.state.board.push(handCard);

    // 🧠 TRACK PLACED CARD FOR AI INTELLIGENCE
    window.cardIntelligence.updateCardsSeen([handCard]);
    console.log(`✅ ADDED: ${handCard.value}${handCard.suit} to board (${game.state.board.length} cards total)`);
    
    // STEP 3: Clear combo areas
    game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
    console.log(`✅ CLEARED: All combo areas`);
    
    // STEP 4: Clean up drag state
    game.state.draggedCard = null;
    
    // STEP 5: Handle turn switching
    const playerCards = game.state.hands[0].length;
    if (playerCards > 0) {
      // Player still has cards, switch to next bot
      game.nextPlayer();
      console.log(`🔄 PLAYER placed card, switching to Bot ${game.state.currentPlayer}`);
    } else {
      // Player is out of cards
      console.log(`🏁 PLAYER is out of cards`);
      game.nextPlayer();
    }
    
    // STEP 6: Update UI
    ui.render();
    
    // STEP 7: Check game end and continue
    checkGameEnd();
    
    if (game.state.currentPlayer !== 0) {
      setTimeout(async () => await scheduleNextBotTurn(), 100);
    }
    
  } catch (error) {
    console.error(`🚨 CRITICAL ERROR in handleBoardDrop:`, error);
    game.state.draggedCard = null;
    ui.render();
  }
}

// Game end logic - now mode-aware
function checkGameEnd() {
  const endResult = game.checkGameEnd();
  
  if (endResult.gameOver) {
    // Game completely over
    if (game.currentMode.onGameEnd) {
      game.currentMode.onGameEnd(game);
    }
    showGameOverModal(endResult);
  } else if (endResult.roundOver) {
    // Round over, but game continues
    if (game.currentMode.onRoundEnd) {
      game.currentMode.onRoundEnd(game);
    }
    showRoundEndModal(endResult);
  } else if (endResult.continueRound) {
    // Deal new cards and continue
    dealNewCards();
  }
  // If endResult.continue, just keep playing
}

function dealNewCards() {
  try {
    // 🔥 DON'T increment round here - that should happen when deck actually runs out
    console.log(`🎮 Dealing new cards - Current Round: ${game.currentRound}`);
    
    // 🎯 CRITICAL FIX: Use EXISTING deck, don't create new one!
    if (game.state.deck.length < 12) {
      console.log(`🚨 DECK TOO LOW: Only ${game.state.deck.length} cards left - this should trigger game end!`);
      checkGameEnd();
      return;
    }
    
    // Deal from EXISTING deck - this preserves the board!
    const dealResult = dealCards(game.state.deck, 3, 4, 0);  // ← Use existing deck!
    
    game.state.hands = dealResult.players;
    // 🔥 BOARD STAYS UNCHANGED - this is the key!
    game.state.deck = dealResult.remainingDeck;
    game.state.currentPlayer = 0;
    game.state.lastCapturer = null;
    
    console.log(`✅ NEW CARDS DEALT: ${game.state.hands[0].length} cards to each player`);
    console.log(`🎯 BOARD PRESERVED: ${game.state.board.length} cards remain for jackpot`);
    console.log(`📦 DECK REMAINING: ${game.state.deck.length} cards`);
    
    ui.smartMessages.updateMessage('turn_start');
    ui.render();
  } catch (e) {
    console.error('Error dealing new round:', e);
    ui.smartMessages.showErrorMessage('Error dealing cards! Restart the game.');
  }
}

// Bot AI - now works with any mode
async function aiTurn() {
  if (game.state.currentPlayer === 0) {
    console.error('🚨 CRITICAL: AI called for player turn!');
    return;
  }

  const playerIndex = game.state.currentPlayer;
  
  // 🔥 CRITICAL FIX: Check if current bot is out of cards
  if (game.state.hands[playerIndex].length === 0) {
    console.log(`🤖 BOT ${playerIndex}: Out of cards, switching to next player`);
    game.nextPlayer();
    ui.render();
    
    // 🚨 CRITICAL: Check if we need to continue or end round
    const remainingPlayers = game.state.hands.filter((hand, idx) => hand.length > 0);
    const playersWithCards = remainingPlayers.length;
    
    console.log(`🎯 REMAINING PLAYERS WITH CARDS: ${playersWithCards}`);
    
    if (playersWithCards === 0) {
      // All players out of cards - check game end
      console.log(`🏁 ALL PLAYERS OUT OF CARDS - CHECKING GAME END`);
      checkGameEnd();
      return;
    } else if (game.state.currentPlayer !== 0 && game.state.hands[game.state.currentPlayer].length > 0) {
      // Continue with next bot that has cards
      console.log(`🤖 CONTINUING TO BOT ${game.state.currentPlayer}`);
      setTimeout(async () => await scheduleNextBotTurn(), 1000);
    } else if (game.state.currentPlayer === 0 && game.state.hands[0].length === 0) {
      // Player is also out of cards, find next bot with cards
      console.log(`🎯 PLAYER ALSO OUT - FINDING NEXT BOT WITH CARDS`);
      let nextBot = 1;
      while (nextBot < 3 && game.state.hands[nextBot].length === 0) {
        nextBot++;
      }
      if (nextBot < 3) {
        game.state.currentPlayer = nextBot;
        console.log(`🤖 SWITCHING TO BOT ${nextBot}`);
        setTimeout(async () => await scheduleNextBotTurn(), 1000);
      } else {
        console.log(`🏁 NO MORE BOTS WITH CARDS - ENDING ROUND`);
        checkGameEnd();
      }
    }
    return;
  }

  console.log(`🤖 BOT ${playerIndex} TURN - Hand: ${game.state.hands[playerIndex].length} cards`);
  
  setTimeout(() => {
    const move = aiMove(game.state.hands[playerIndex], game.state.board, game.state.settings.botDifficulty);
    console.log(`🤖 BOT ${playerIndex} DIFFICULTY: ${game.state.settings.botDifficulty}, MOVE: ${move?.action}`);
    
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

// Sound system
function playSound(type) {
  if (game.state.settings.soundEffects === 'on' && window.sounds && window.sounds[type]) {
    window.sounds[type].play().catch(e => console.error('Sound play failed:', e));
  }
}

// Drag and drop handlers - simplified
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

function handleDrop(e, slot) {
  e.preventDefault();
  if (game.state.currentPlayer !== 0 || !game.state.draggedCard) return;

  // Remove from previous slot if moving within combo area
  if (game.state.draggedCard.slot !== undefined) {
    game.state.combination[game.state.draggedCard.slot] = game.state.combination[game.state.draggedCard.slot].filter((_, i) => i !== game.state.draggedCard.comboIndex);
  }

  // Handle base slot replacement
  if (slot === 'base' && game.state.combination.base.length > 0) {
    const existingBase = game.state.combination.base[0];
    game.state.combination.base = [];
    // Move existing base to first available slot
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

  // Add card to new slot
  game.state.combination[slot].push({
    source: game.state.draggedCard.source,
    index: game.state.draggedCard.index,
    card: game.state.draggedCard.card
  });

  console.log(`🔧 CARD DROPPED: ${game.state.draggedCard.card.value}${game.state.draggedCard.card.suit} to slot ${slot}`);
  game.state.draggedCard = null;
  ui.render();
}

function handleDropOriginal(e, source, index) {
  e.preventDefault();
  if (game.state.currentPlayer !== 0 || !game.state.draggedCard) return;

  if (game.state.draggedCard.slot !== undefined) {
    const originalSlot = game.state.draggedCard.slot;
    game.state.combination[originalSlot] = game.state.combination[originalSlot].filter((_, i) => i !== game.state.draggedCard.comboIndex);
    game.state.draggedCard = null;
    ui.render();
  }
}

// Touch handlers (simplified)
function handleTouchStart(e, source, data) {
  if (game.state.currentPlayer !== 0) return;
  e.preventDefault();
  // Touch handling logic here
}

function handleTouchEnd(e) {
  if (game.state.currentPlayer !== 0) return;
  e.preventDefault();
  // Touch handling logic here
}

function handleTouchDrop(e, targetType, data) {
  e.preventDefault();
  // Touch drop logic here
}

// Hint system
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
    ui.smartMessages.showErrorMessage("No valid captures available. Place a card to end your turn.");
    return;
  }

  const hint = possibleCaptures[Math.floor(Math.random() * possibleCaptures.length)];
  // Highlight hint cards
  // ... hint display logic
  
  setTimeout(() => {
    // Remove hint highlights
    ui.smartMessages.showMessage("Hint: Try combining the highlighted cards!");
  }, 3000);
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

// Make functions globally available for event handlers
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