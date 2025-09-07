/* 
 * STACKED! - Main Game Controller with LEGENDARY HINT SYSTEM
 * 🔥 FIXED: Centralized bot turn management + No more scheduling conflicts
 */

// 🎯 LEGENDARY HINT SYSTEM CLASS
class HintSystem {
  constructor(gameEngine, uiSystem) {
    this.game = gameEngine;
    this.ui = uiSystem;
    this.suitSymbols = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
    this.currentHints = [];
    this.highlightedCards = [];
  }

  // 🧠 ENHANCED: Use CardIntelligence for hint detection
  analyzeAllPossibleCaptures() {
    if (this.game.state.currentPlayer !== 0) {
      return [];
    }

    const playerHand = this.game.state.hands[0];
    const board = this.game.state.board;// 🔥 USE CARD INTELLIGENCE SYSTEM!
    if (!window.cardIntelligence) {return this.basicHintDetection(playerHand, board);
    }

    // Get the best capture from Card Intelligence
    const bestCapture = window.cardIntelligence.findBestCapture(playerHand, board, 'calculator');
    
    if (bestCapture) {return [this.convertToHintFormat(bestCapture)];
    }

    // If no captures found, check all cards for any possible captures
    const allCaptures = [];
    playerHand.forEach((handCard, handIndex) => {
      const captures = canCapture(handCard, board); // Use existing gameLogic function
      captures.forEach(capture => {
        allCaptures.push(this.convertGameLogicToHint(handCard, handIndex, capture));
      });
    });

    return this.prioritizeHints(allCaptures);
  }
  // 🔄 CONVERT Card Intelligence capture to hint format
  convertToHintFormat(bestCapture) {
    const handCard = bestCapture.handCard;
    const handIndex = this.game.state.hands[0].findIndex(card => card.id === handCard.id);
    
    // Convert target cards to hint format
    const targetCards = bestCapture.capture.targets.map(targetCard => {
      const boardIndex = this.game.state.board.findIndex(card => card.id === targetCard.id);
      return { card: targetCard, index: boardIndex };
    });

    return {
      type: bestCapture.capture.type,
      handCard: { card: handCard, index: handIndex },
      targetCards: targetCards,
      area: bestCapture.capture.type === 'pair' ? 'match' : 'sum1',
      score: bestCapture.evaluation.totalScore,
      description: bestCapture.evaluation.reasoning
    };
  }

  // 🔄 CONVERT gameLogic capture to hint format
  convertGameLogicToHint(handCard, handIndex, capture) {
    const targetCards = capture.type.map(cardIndex => {  // FIXED: Was capture.cards, assuming typo in original
      return { card: this.game.state.board[cardIndex], index: cardIndex };
    });

    return {
      type: capture.type,
      handCard: { card: handCard, index: handIndex },
      targetCards: targetCards,
      area: capture.type === 'pair' ? 'match' : 'sum1',
      score: capture.score || this.calculateCaptureScore([handCard, ...targetCards.map(tc => tc.card)]),
      description: `${capture.type.toUpperCase()}: ${handCard.value}${this.suitSymbols[handCard.suit]} captures ${targetCards.map(tc => tc.card.value + this.suitSymbols[tc.card.suit]).join(' + ')}`
    };
  }

  // 🚨 FALLBACK: Basic hint detection when Card Intelligence unavailable
  basicHintDetection(playerHand, board) {
    const allCaptures = [];
    
    playerHand.forEach((handCard, handIndex) => {
      if (typeof canCapture === 'function') {
        const captures = canCapture(handCard, board);
        captures.forEach(capture => {
          allCaptures.push(this.convertGameLogicToHint(handCard, handIndex, capture));
        });
      }
    });

    return this.prioritizeHints(allCaptures);
  }

  // 🏆 HINT PRIORITIZATION SYSTEM
  prioritizeHints(captures) {
    if (captures.length === 0) return [];

    return captures.sort((a, b) => {
      // Priority 1: Higher scores first
      if (a.score !== b.score) return b.score - a.score;
      
      // Priority 2: Multi-card captures (more complex = better)
      const aComplexity = a.targetCards.length;
      const bComplexity = b.targetCards.length;
      if (aComplexity !== bComplexity) return bComplexity - aComplexity;
      
      // Priority 3: Pairs over sums (easier to see)
      if (a.type !== b.type) {
        return a.type === 'pair' ? -1 : 1;
      }
      
      return 0;
    });
  }

  // 💰 CALCULATE CAPTURE SCORE
  calculateCaptureScore(cards) {
    const pointsMap = {
      'A': 15, 'K': 10, 'Q': 10, 'J': 10, '10': 10,
      '9': 5, '8': 5, '7': 5, '6': 5, '5': 5, '4': 5, '3': 5, '2': 5
    };
    return cards.reduce((total, card) => total + (pointsMap[card.value] || 0), 0);
  }

  // 🎮 GET CARD NUMERIC VALUE
  getCardValue(card) {
    if (card.value === 'A') return 1;
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    return parseInt(card.value) || 0;
  }

  // 🎯 MAIN HINT DISPLAY FUNCTION
  showHint() {// Clear any existing hints
    this.clearHints();
    
    // Find all possible captures
    const captures = this.analyzeAllPossibleCaptures();
    
    if (captures.length === 0) {
      this.showNoHintsMessage();
      return;
    }

    // Get the best hint
    const bestHint = captures[0];// Show the hint
    this.displayHintPopup(bestHint);
    this.highlightHintCards(bestHint);
    
    // Store current hints for cleanup
    this.currentHints = [bestHint];
  }

  // 🎪 DISPLAY HINT POPUP
  displayHintPopup(hint) {
    // Remove any existing hint popup
    const existingPopup = document.getElementById('hint-popup');
    if (existingPopup) {
      existingPopup.remove();
    }

    // Create new popup
    const popup = document.createElement('div');
    popup.id = 'hint-popup';
    popup.className = 'hint-popup';
    
    // Build hint content
    const handCardName = `${hint.handCard.card.value}${this.suitSymbols[hint.handCard.card.suit]}`;
    const targetNames = hint.targetCards.map(tc => 
      `${tc.card.value}${this.suitSymbols[tc.card.suit]}`
    ).join(' + ');
    
    let suggestionText = '';
    if (hint.type === 'pair') {
      suggestionText = `🎯 <strong>PAIR CAPTURE!</strong><br>
                       Use <span class="highlight-card">${handCardName}</span> to capture <span class="highlight-card">${targetNames}</span><br>
                       <small>• Place both in Match area • Worth ${hint.score} points!</small>`;
    } else {
      suggestionText = `🧮 <strong>SUM CAPTURE!</strong><br>
                       Use <span class="highlight-card">${handCardName}</span> as base, capture <span class="highlight-card">${targetNames}</span><br>
                       <small>• Place base in Base area, targets in ${hint.area.charAt(0).toUpperCase() + hint.area.slice(1)} area • Worth ${hint.score} points!</small>`;
    }
    
    popup.innerHTML = `
      <div class="hint-content">
        <div class="hint-header">💡 SMART HINT</div>
        <div class="hint-suggestion">${suggestionText}</div>
        <button class="hint-close" onclick="window.hintSystem.clearHints()">Got it! ✓</button>
      </div>
    `;
    
    // Position popup
    const gameArea = document.querySelector('.table') || document.body;
    gameArea.appendChild(popup);
    
    // Animate in
    setTimeout(() => popup.classList.add('show'), 50);
    
    // Auto-hide after 8 seconds
    setTimeout(() => this.clearHints(), 8000);
  }

  // ✨ HIGHLIGHT HINT CARDS with glow effect
  highlightHintCards(hint) {
    const highlightedElements = [];
    
    // Highlight hand card
    const handCards = document.querySelectorAll('#player-hand .card');
    if (handCards[hint.handCard.index]) {
      handCards[hint.handCard.index].classList.add('hint-glow', 'hint-hand-card');
      highlightedElements.push(handCards[hint.handCard.index]);
    }
    
    // Highlight target cards on board
    hint.targetCards.forEach(target => {
      const boardCards = document.querySelectorAll('#board .card');
      if (boardCards[target.index]) {
        boardCards[target.index].classList.add('hint-glow', 'hint-target-card');
        highlightedElements.push(boardCards[target.index]);
      }
    });
    
    this.highlightedCards = highlightedElements;}

  // 🚫 NO HINTS AVAILABLE MESSAGE
  showNoHintsMessage() {
    const popup = document.createElement('div');
    popup.id = 'hint-popup';
    popup.className = 'hint-popup';
    
    popup.innerHTML = `
      <div class="hint-content">
        <div class="hint-header">🤔 NO CAPTURES AVAILABLE</div>
        <div class="hint-suggestion">
          <strong>Try placing a card to end your turn!</strong><br>
          <small>• Drag a card from your hand to the board</small><br>
          <small>• Look for strategic placements</small>
        </div>
        <button class="hint-close" onclick="window.hintSystem.clearHints()">Understood ✓</button>
      </div>
    `;
    
    const gameArea = document.querySelector('.table') || document.body;
    gameArea.appendChild(popup);
    
    setTimeout(() => popup.classList.add('show'), 50);
    setTimeout(() => this.clearHints(), 5000);
  }

  // 🧹 CLEAR ALL HINTS
  clearHints() {
    // Remove popup
    const popup = document.getElementById('hint-popup');
    if (popup) {
      popup.classList.remove('show');
      setTimeout(() => popup.remove(), 300);
    }
    
    // Remove card highlights
    this.highlightedCards.forEach(card => {
      card.classList.remove('hint-glow', 'hint-hand-card', 'hint-target-card');
    });
    
    this.highlightedCards = [];
    this.currentHints = [];}

// Global game instance
let game = null;
let ui = null;
let botModal = null;
let modeSelector = null;

// Ensure GSM reference for state constants
const gameStateManager = window.gameStateManager;

// 🎯 CENTRALIZED BOT TURN MANAGEMENT
let botTurnInProgress = false;


/* 
 * 🔍 CLEAN DEBUG LOGGING SYSTEM
 * Crystal clear, structured logging for easy debugging
 * Add these functions to main.js
 */

// 🎯 CLEAN LOGGING CONFIGURATION


// 🎮 CLEAN GAME STATE LOGGER


// 🤖 BOT TURN TRACKER


// 🎯 GAME STATE MANAGER DECISION LOGGER


// 🔄 TURN MANAGEMENT LOGGER


// 🚨 ERROR LOGGER


// 🎯 CRITICAL CHECKPOINT LOGGER


// 🔧 LOGGING CONTROL FUNCTIONS






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
  ui.render();}

// Main initialization
function initGame() {
  if (window.cardIntelligence) {
    window.cardIntelligence.reset();
  }

  logCheckpoint('GAME INITIALIZATION', { mode: 'classic', difficulty: 'legendary' });
  
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

// 🔥 CRITICAL FIX: Schedule bot turn if bot goes first
if (game.state.currentPlayer !== 0) {setTimeout(() => scheduleNextBotTurn(), 1000);
}

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

// 🔥 TRACK LAST ACTION - CRITICAL FOR GAME STATE MANAGER  
game.state.lastAction = 'capture';if (game.currentMode.onCapture) {
    game.currentMode.onCapture(game, allCapturedCards);
  }
  
  // 🎯 SEND SUCCESS EVENT TO MESSAGE CONTROLLER
  const points = game.calculateScore(allCapturedCards);
  window.messageController.handleGameEvent('CAPTURE_SUCCESS', {
    points: points,
    cardsCount: allCapturedCards.length
  });
  
  game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
  
    ui.render();
  playSound('capture');

  // ✅ LET GAMESTATEMANAGER DECIDE WHAT HAPPENS NEXT:
  const result = window.gameStateManager.determineGameState(game);
  handleGameStateResult(result);
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

// 🔥 TRACK LAST ACTION - CRITICAL FOR GAME STATE MANAGER
  game.state.lastAction = 'place';// 🎯 SEND CARD PLACED EVENT TO MESSAGE CONTROLLER
    window.messageController.handleGameEvent('CARD_PLACED', {
      cardName: `${handCard.value}${handCard.suit}`
    });

        ui.render();

    // Centralized state progression
    const gs = window.gameStateManager.determineGameState(game);
    handleGameStateResult(gs);

    
  } catch (error) {game.state.draggedCard = null;
    ui.render();
  }
}

// Add this OUTSIDE the function (around line 380, after the logging functions):
let checkGameEndCount = 0;

// Then in checkGameEnd() function:
function checkGameEnd() {
  logGameState(++checkGameEndCount, 'checkGameEnd() called');
  
  // 🔥 USE NEW GAME STATE MANAGER
  const result = window.gameStateManager.determineGameState(game);// Handle each possible state
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
      
    default:handleGameStateError({
        data: {
          message: `Unknown game state: ${result.state}`,
          userMessage: 'Game encountered an unknown state. Please restart.',
          technicalDetails: JSON.stringify(result, null, 2)
        }
      });
  }
}

// 🔥 REMOVED: dealNewCards() function - Now handled by GameStateManager
// This function has been replaced by handleDealNewHand() below

// 🔥 FIXED: Bot Turn Flag Management - Add this to main.js around line 825

// 🔥 COMPLETELY REWRITTEN: aiTurn() - CENTRALIZED TURN MANAGEMENT
async function aiTurn() {
  // 🛡️ SAFETY GUARD: Only one bot turn at a time
  if (botTurnInProgress) {return;
  }

  // 🛡️ SAFETY GUARD: Only run for bot players
  if (game.state.currentPlayer === 0) {return;
  }

  const playerIndex = game.state.currentPlayer;
  
  // 🛡️ SAFETY GUARD: Check if bot has cards
    if (!game.state.hands[playerIndex] || game.state.hands[playerIndex].length === 0) {ui.render();
    const gs = window.gameStateManager.determineGameState(game);
    handleGameStateResult(gs);
    return;
  }


  // 🎯 SET BOT TURN FLAG
  botTurnInProgress = true;
  
  try {
    logBotTurn('START', playerIndex, { action: 'analyzing' });
    
    // Get AI decision
    const move = aiMove(game.state.hands[playerIndex], game.state.board, game.state.settings.botDifficulty);
    
    let result;
    
    if (move && move.action === 'capture') {result = await botModal.executeCapture(move, playerIndex);
    } else {
      const cardToPlace = move ? move.handCard : game.state.hands[playerIndex][0];result = await botModal.placeCard(cardToPlace, playerIndex);
    }
    
    // 🔥 CRITICAL FIX: ALWAYS CLEAR BOT TURN FLAG BEFORE BRANCHING LOGIC
    botTurnInProgress = false;// 🎯 HANDLE RESULT AND MANAGE TURNS
    if (result.success) {
      logBotTurn('END', playerIndex, { result: 'SUCCESS', nextPlayer: game.state.currentPlayer });
      
      if (result.action === 'capture') {
        // 🎯 TRIGGER BOT CAPTURE SUCCESS EVENT WITH REAL POINTS
        if (window.messageController && move && move.capture) {
          const actualPoints = game.calculateScore([move.handCard, ...move.capture.targets]);
          window.messageController.handleGameEvent('CAPTURE_SUCCESS', {
            points: actualPoints,
            cardsCount: move.capture.targets.length + 1
          });
        }
        
        // Bot captured, check if they can continue
        const remainingCards = game.state.hands[playerIndex].length;
                // Always delegate progression to GameStateManager
        const gs = window.gameStateManager.determineGameState(game);
        handleGameStateResult(gs);

      } else if (result.action === 'place') {
                // Centralize turn flow after a place
        ui.render();
        const gs = window.gameStateManager.determineGameState(game);
        handleGameStateResult(gs);

      }
    } else {// Fallback: place first card
      const fallbackCard = game.state.hands[playerIndex][0];
      if (fallbackCard) {result = await botModal.placeCard(fallbackCard, playerIndex);
        if (result.success) {
          ui.render();
          const gs = window.gameStateManager.determineGameState(game);
          handleGameStateResult(gs);
        }

      }
    }
    
  } catch (error) {// 🔥 CRITICAL: Always clear flag on error
    botTurnInProgress = false;// Emergency fallback: switch to next player
    game.nextPlayer();
    ui.render();
  }
}

async function scheduleNextBotTurn() {
  // 🛡️ SAFETY GUARD: Prevent duplicate scheduling
  if (botTurnInProgress) {return;
  }
  
  // 🛡️ SAFETY GUARD: Only for bot players
  if (game.state.currentPlayer === 0) {return;
  }setTimeout(async () => {await aiTurn();
  }, 3000);
}

function playSound(type) {
  if (game.state.settings.soundEffects === 'on' && window.sounds && window.sounds[type]) {
    window.sounds[type].play().catch(e =>}
}

// Drag and drop handlers
function handleDragStart(e, source, index) {
  // 🔥 NEW: Block all interactions during modals
  if (window.gameIsPaused || (ui && ui.modalManager && ui.modalManager.isModalActive())) {
    e.preventDefault();return;
  }
  
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
  
  // 🔥 NEW: Block all interactions during modals or game pause
  if (window.gameIsPaused || (ui && ui.modalManager && ui.modalManager.isModalActive())) {return;
  }
  
  // 🔥 CRITICAL FIX: Block ALL drag operations during bot turns
  if (game.state.currentPlayer !== 0) {return;
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

  // 🔥 NEW: Add player tracking for combo entries (same as bot system)
const currentPlayer = game.state.currentPlayer;
game.state.combination[slot].push({
  source: game.state.draggedCard.source,
  index: game.state.draggedCard.index,
  card: game.state.draggedCard.card,
  playerSource: currentPlayer, // 🔥 NEW: Track which player added this card
  fromBot: currentPlayer !== 0  // 🔥 NEW: Flag for consistency with bot system
});game.state.draggedCard = null;

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
  if (game.state.currentPlayer !== 0) {return;
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

// 🎯 LEGENDARY HINT FUNCTION
function provideHint() {
  if (game.state.currentPlayer !== 0) {return;
  }
  
  // Initialize hint system if not exists
  if (!window.hintSystem) {
    window.hintSystem = new HintSystem(game, ui);
  }
  
  // Show intelligent hint
  window.hintSystem.showHint();
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

// Make classes globally available
window.DraggableModal = DraggableModal;
window.HintSystem = HintSystem;

// 🎯 NEW GAME STATE HANDLER FUNCTIONS

// 🎯 CONTINUE TURN - Player found with cards
function handleContinueTurn(result) {
  const playerIndex = result.data.playerIndex;game.state.currentPlayer = playerIndex;
  ui.render();

  if (playerIndex !== 0) {// 🔥 FIX: Call aiTurn directly instead of scheduleNextBotTurn
    setTimeout(() => aiTurn(), 1000);
  } else {
    window.messageController.handleGameEvent('TURN_START');
  }
}


// 🎴 DEAL NEW HAND - Same dealer, same starting player
function handleDealNewHand(result) {try {
    // Deal new cards (existing function)
    const dealResult = dealCards(game.state.deck, 3, 4, 0);
    game.state.hands = dealResult.players;
    game.state.deck = dealResult.remainingDeck;
    
    // Keep same starting player as beginning of round
    game.state.currentPlayer = result.data.startingPlayer;
    game.state.lastCapturer = null;// Send new hand event to message controller
window.messageController.handleGameEvent('NEW_HAND', {
  handNumber: Math.floor((52 - game.state.deck.length) / 12),
  roundNumber: game.currentRound
});
    
    // Update UI
    ui.render();
    
    // If starting player is a bot, schedule their turn
    if (result.data.startingPlayer !== 0) {setTimeout(() => scheduleNextBotTurn(), 1000);
    }
    
  } catch (error) {window.messageController.handleGameEvent('CAPTURE_ERROR', {
      message: 'Error dealing new hand! Please restart the game.'
    });
  }
}

// 🔄 END ROUND - Apply jackpot and show modal (PHASE 1 ONLY)
function handleEndRound(result) {// PHASE 1: Apply jackpot and show modal - NO SETUP
  if (result.data.jackpot.hasJackpot) {// Apply jackpot to game engine scores
    const jackpot = result.data.jackpot;
    game.addScore(jackpot.winner, jackpot.points);
    game.addOverallScore(jackpot.winner, jackpot.points);
    
    // Clear the board after jackpot
    game.state.board = [];
  }
  
  // Notify current mode of round end
  if (game.currentMode.onRoundEnd) {
    game.currentMode.onRoundEnd(game);
  }
  
  // 🔥 NEW: Use centralized modal system and STOP
  ui.showModal('round_end', result.data);
  
  // NO deck creation, NO dealing, NO bot scheduling!
}

// 🔥 NEW: PHASE 2 - Complete round setup when continue clicked
function resumeNextRound(roundData) {// Create new deck for new round
  game.state.deck = createDeck();// Set up new round properly
  const newStartingPlayer = (roundData.newDealer + 1) % 3;
  game.state.currentPlayer = newStartingPlayer;

  // Deal new cards from fresh deck
  const dealResult = dealCards(game.state.deck, 3, 4, 4);
  game.state.hands = dealResult.players;
  game.state.deck = dealResult.remainingDeck;
  game.state.board = dealResult.board;// Apply round and dealer from GameStateManager
  game.currentRound = roundData.newRound;
  game.currentDealer = roundData.newDealer;// Update UI after setup
  ui.render();

  // Schedule first turn if starting player is bot
  if (newStartingPlayer !== 0) {setTimeout(() => scheduleNextBotTurn(), 1000);
  }
}

// 🏆 END GAME - Show game over modal
function handleEndGame(result) {// Apply jackpot to game scores if it exists
  if (result.data.jackpot.hasJackpot) {// Apply jackpot to game engine scores
    const jackpot = result.data.jackpot;
    game.addScore(jackpot.winner, jackpot.points);
    game.addOverallScore(jackpot.winner, jackpot.points);
    
    // Clear the board after jackpot
    game.state.board = [];
  }
  
  // Notify current mode of game end
  if (game.currentMode.onGameEnd) {
    game.currentMode.onGameEnd(game);
  }
  
  // 🔥 NEW: Use centralized modal system
  ui.showModal('game_over', result.data);
  
  // Update UI one final time
  ui.render();
}

// 🚨 HANDLE GAME STATE ERROR
function handleGameStateError(result) {// 🔥 NEW: Use centralized modal system
  ui.showModal('error', result.data);
  
  // Also send error to message controller
  window.messageController.handleGameEvent('CAPTURE_ERROR', {
    message: result.data.userMessage
  });
}

// Make resumeNextRound globally available
window.resumeNextRound = resumeNextRound;

// Initialize the game
initGame();

function handleGameStateResult(result) {switch(result.state) {
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
      
    default:}
}

// 🔥 ENSURE GLOBAL VARIABLES ARE SET
window.gameIsPaused = false;