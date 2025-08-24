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

  const gameState = this.game.getState();
  if (!gameState || !gameState.hands || !gameState.board) {
    console.error('Invalid game state in analyzeAllPossibleCaptures');
    return [];
  }

  const playerHand = gameState.hands[0];
  const board = gameState.board;

  console.log(`🎯 ANALYZING HINTS using CARD INTELLIGENCE: ${playerHand.length} hand cards vs ${board.length} board cards`);

  // 🔥 USE CARD INTELLIGENCE SYSTEM!
  if (!window.cardIntelligence) {
    console.warn('⚠️ Card Intelligence not available - falling back to basic detection');
    return this.basicHintDetection(playerHand, board);
  }

  // Get the best capture from Card Intelligence
  const bestCapture = window.cardIntelligence.findBestCapture(playerHand, board, 'calculator');
  
  if (bestCapture) {
    console.log(`🧠 CARD INTELLIGENCE FOUND: ${bestCapture.evaluation.reasoning}`);
    return [this.convertToHintFormat(bestCapture)];
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
  const gameState = this.game.getState();
  if (!gameState || !gameState.hands || !gameState.board) {
    console.error('Invalid game state in convertToHintFormat');
    return null;
  }

  const handCard = bestCapture.handCard;
  const handIndex = gameState.hands[0].findIndex(card => card.id === handCard.id);
  
  // Convert target cards to hint format
  const targetCards = bestCapture.capture.targets.map(targetCard => {
    const boardIndex = gameState.board.findIndex(card => card.id === targetCard.id);
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
  const gameState = this.game.getState();
  if (!gameState || !gameState.board) {
    console.error('Invalid game state in convertGameLogicToHint');
    return null;
  }

  const targetCards = capture.cards.map(cardIndex => {
    return { card: gameState.board[cardIndex], index: cardIndex };
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
  showHint() {
    console.log(`🎯 HINT REQUESTED!`);
    
    // Clear any existing hints
    this.clearHints();
    
    // Find all possible captures
    const captures = this.analyzeAllPossibleCaptures();
    
    if (captures.length === 0) {
      this.showNoHintsMessage();
      return;
    }

    // Get the best hint
    const bestHint = captures[0];
    console.log(`🏆 BEST HINT: ${bestHint.description} (${bestHint.score} pts)`);
    
    // Show the hint
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
    
    this.highlightedCards = highlightedElements;
    console.log(`✨ HIGHLIGHTED: ${highlightedElements.length} cards`);
  }

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
    this.currentHints = [];
    
    console.log(`🧹 HINTS CLEARED`);
  }

  // 🔧 DEBUG: Show all possible captures
  debugAllCaptures() {
    const captures = this.analyzeAllPossibleCaptures();
    console.log(`🔍 DEBUG: Found ${captures.length} possible captures:`);
    captures.forEach((capture, index) => {
      console.log(`${index + 1}. ${capture.description} (${capture.score} pts)`);
    });
    return captures;
  }
}

// Global game instance
let game = null;
let ui = null;
let botModal = null;
let modeSelector = null;

// 🎯 CENTRALIZED BOT TURN MANAGEMENT
let botTurnInProgress = false;

/* 
 * 🔍 CLEAN DEBUG LOGGING SYSTEM
 * Crystal clear, structured logging for easy debugging
 * Add these functions to main.js
 */

// 🎯 CLEAN LOGGING CONFIGURATION
const DEBUG_CONFIG = {
  enabled: true,
  showGameState: true,
  showBotTurns: true,
  showDecisions: true,
  showCardCounts: true
};

// 🎮 CLEAN GAME STATE LOGGER
function logGameState(checkNumber, reason = '') {
  if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.showGameState) return;
  
  const state = game.getState();
  
  // 🔍 COUNT ALL CARD LOCATIONS
  const handCounts = state.hands.map(hand => hand ? hand.length : 0);
  const handsTotal = handCounts.reduce((sum, count) => sum + count, 0);
  const boardCount = state.board ? state.board.length : 0;
  const deckCount = state.deck ? state.deck.length : 0;
  
  // 🔥 FIX: Count combo cards too!
  const comboCount = Object.values(state.combination).reduce((total, area) => {
    return total + (area ? area.length : 0);
  }, 0);
  
  // 🎯 TOTAL CARD COUNT
  const totalGameCards = handsTotal + boardCount + deckCount + comboCount;
  
  console.log(`
🎮 GAME STATE CHECK #${checkNumber} ${reason ? `(${reason})` : ''}
┌─ CARDS ────────────────────────────────────────────────────────
│  Hands: [${handCounts.join(', ')}] = ${handsTotal} total
│  Board: ${boardCount} cards
│  Deck:  ${deckCount} cards
│  Combo: ${comboCount} cards  🔥 NEW!
│  TOTAL: ${totalGameCards}/52 cards ${totalGameCards !== 52 ? '⚠️ MISMATCH!' : '✅'}
├─ PLAYERS ─────────────────────────────────────────────────────
│  Current: Player ${state.currentPlayer} (${['Human', 'Bot 1', 'Bot 2'][state.currentPlayer]})
│  Dealer: Player ${game.currentDealer} (${['Human', 'Bot 1', 'Bot 2'][game.currentDealer]})
│  Last Action: ${state.lastAction || 'none'}
│  Last Capturer: ${state.lastCapturer !== null ? state.lastCapturer : 'none'}
├─ SCORES ──────────────────────────────────────────────────────
│  Player: ${state.scores.player}  |  Bot 1: ${state.scores.bot1}  |  Bot 2: ${state.scores.bot2}
│  Round: ${game.currentRound}  |  Target: ${state.settings.targetScore}
└────────────────────────────────────────────────────────────────`);

  // 🚨 DETAILED BREAKDOWN IF MISMATCH
  if (totalGameCards !== 52) {
    console.error(`🚨 CARD MISMATCH BREAKDOWN:`);
    console.error(`   Expected: 52 cards total`);
    console.error(`   Found: ${totalGameCards} cards`);
    console.error(`   Missing: ${52 - totalGameCards} cards`);
    
    // 🔍 DETAILED COMBO BREAKDOWN
    if (comboCount > 0) {
      const comboBreakdown = {
        base: state.combination.base?.length || 0,
        sum1: state.combination.sum1?.length || 0,
        sum2: state.combination.sum2?.length || 0,
        sum3: state.combination.sum3?.length || 0,
        match: state.combination.match?.length || 0
      };
      console.error(`   Combo Details: Base:${comboBreakdown.base}, Sum1:${comboBreakdown.sum1}, Sum2:${comboBreakdown.sum2}, Sum3:${comboBreakdown.sum3}, Match:${comboBreakdown.match}`);
    }
  }
}

// 🤖 BOT TURN TRACKER
function logBotTurn(phase, botIndex, details = {}) {
  if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.showBotTurns) return;
  
  const botName = ['Human', 'Bot 1', 'Bot 2'][botIndex];
  const gameState = game.getState();
  const handCount = gameState.hands[botIndex] ? gameState.hands[botIndex].length : 0;
  
  switch(phase) {
    case 'START':
      console.log(`
🤖 BOT TURN START: ${botName}
├─ Cards Available: ${handCount}
├─ Board Cards: ${gameState.board.length}
├─ Turn Flag: ${botTurnInProgress ? 'IN PROGRESS' : 'FREE'}
└─ Action: ${details.action || 'Determining...'}`);
      break;
      
    case 'ACTION':
      console.log(`
🎯 BOT ACTION: ${botName} → ${details.action}
├─ Card: ${details.card || 'unknown'}
├─ Target: ${details.target || 'board'}
└─ Remaining: ${details.remaining || handCount - 1} cards`);
      break;
      
    case 'END':
      console.log(`
✅ BOT TURN END: ${botName}
├─ Result: ${details.result || 'SUCCESS'}
├─ Cards Left: ${handCount}
├─ Next Player: ${details.nextPlayer !== undefined ? details.nextPlayer : 'TBD'}
└─ Turn Flag: ${botTurnInProgress ? '⚠️ STILL SET' : 'CLEARED'}`);
      break;
      
    case 'ERROR':
      console.log(`
🚨 BOT TURN ERROR: ${botName}
├─ Error: ${details.error}
├─ Cards: ${handCount}
├─ Turn Flag: ${botTurnInProgress ? '⚠️ STUCK' : 'OK'}
└─ Recovery: ${details.recovery || 'Unknown'}`);
      break;
  }
}

// 🎯 GAME STATE MANAGER DECISION LOGGER
function logGSMDecision(attempt, snapshot, decision) {
  if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.showDecisions) return;
  
  console.log(`
🎯 GAME STATE MANAGER DECISION #${attempt}
┌─ INPUT ────────────────────────────────────────────────────────
│  Hands: [${snapshot.handSizes.join(', ')}] = ${snapshot.totalCardsInHands} total
│  Deck: ${snapshot.deckSize} | Board: ${snapshot.boardSize}
│  Current Player: ${snapshot.currentPlayer} | Last Action: ${snapshot.gameEngine.state.lastAction || 'none'}
│  Last Capturer: ${snapshot.lastCapturer !== null ? snapshot.lastCapturer : 'none'}
├─ ANALYSIS ────────────────────────────────────────────────────
│  Can Deal New Hand: ${snapshot.deckSize >= 12 ? 'YES' : 'NO'} (need 12, have ${snapshot.deckSize})
│  Players With Cards: ${snapshot.handSizes.map((size, i) => size > 0 ? i : null).filter(i => i !== null).join(', ') || 'NONE'}
│  Highest Score: ${Math.max(snapshot.currentScores.player, snapshot.currentScores.bot1, snapshot.currentScores.bot2)}/${snapshot.targetScore}
├─ DECISION ────────────────────────────────────────────────────
│  STATE: ${decision.state}
│  REASON: ${decision.data?.reason || 'Not provided'}
│  NEXT PLAYER: ${decision.nextPlayer !== undefined ? decision.nextPlayer : 'N/A'}
└────────────────────────────────────────────────────────────────`);
}

// 🔄 TURN MANAGEMENT LOGGER
function logTurnChange(from, to, reason) {
  if (!DEBUG_CONFIG.enabled) return;
  
  const playerNames = ['Human', 'Bot 1', 'Bot 2'];
  console.log(`
🔄 TURN CHANGE: ${playerNames[from]} → ${playerNames[to]}
├─ Reason: ${reason}
├─ Cards: [${gameState.hands.map(h => h.length).join(', ')}]
└─ Bot Flag: ${botTurnInProgress ? '⚠️ SET' : 'CLEAR'}`);
}

// 🚨 ERROR LOGGER
function logError(category, error, context = {}) {
  console.log(`
🚨 ERROR: ${category}
├─ Message: ${error.message || error}
├─ Context: ${JSON.stringify(context, null, 2)}
└─ Stack: ${error.stack ? error.stack.split('\n')[0] : 'No stack'}`);
}

// 🎯 CRITICAL CHECKPOINT LOGGER
function logCheckpoint(name, data = {}) {
  if (!DEBUG_CONFIG.enabled) return;
  
  console.log(`
🎯 CHECKPOINT: ${name}
├─ Time: ${new Date().toLocaleTimeString()}
├─ Data: ${JSON.stringify(data, null, 2)}
└────────────────────────────────────────────────────────────────`);
}

// 🔧 LOGGING CONTROL FUNCTIONS
function enableDebugLogging() {
  DEBUG_CONFIG.enabled = true;
  console.log('🔍 DEBUG LOGGING ENABLED');
}

function disableDebugLogging() {
  DEBUG_CONFIG.enabled = false;
  console.log('🔇 DEBUG LOGGING DISABLED');
}

function setLogLevel(gameState = true, botTurns = true, decisions = true, cardCounts = true) {
  DEBUG_CONFIG.showGameState = gameState;
  DEBUG_CONFIG.showBotTurns = botTurns;
  DEBUG_CONFIG.showDecisions = decisions;
  DEBUG_CONFIG.showCardCounts = cardCounts;
  console.log('🔧 LOG LEVELS UPDATED:', DEBUG_CONFIG);
}

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
if (game.state.currentPlayer !== 0) {
  console.log(`🤖 GAME STARTS WITH BOT ${game.state.currentPlayer} - SCHEDULING FIRST TURN`);
  setTimeout(() => scheduleNextBotTurn(), 1000);
}

// Clear localStorage after game starts
localStorage.removeItem('selectedDifficulty');
localStorage.removeItem('selectedMode');
}

// 🎯 UPDATED handleSubmit() WITH MESSAGE EVENTS
function handleSubmit() {
  if (game.state.currentPlayer !== 0) return;

  const gameState = game.getState();
  if (!gameState || !gameState.combination) {
    console.error('Invalid game state in handleSubmit');
    return;
  }

  const baseCards = gameState.combination.base;

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
    { name: 'sum1', cards: gameState.combination.sum1 },
    { name: 'sum2', cards: gameState.combination.sum2 },
    { name: 'sum3', cards: gameState.combination.sum3 },
    { name: 'match', cards: gameState.combination.match }
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

// 🔥 NEW: Execute capture via CardManager
  game.executeCapture(baseCard, validCaptures, allCapturedCards);
  
  // Update card intelligence
  if (window.cardIntelligence) {
    window.cardIntelligence.updateCardsSeen(allCapturedCards);
  }

  // Track last action
  game.state.lastAction = 'capture';
  console.log('🎯 LAST ACTION SET TO: capture');
    
  if (game.currentMode.onCapture) {
    game.currentMode.onCapture(game, allCapturedCards);
  }
  
  // Send success event
  const points = game.calculateScore(allCapturedCards);
  window.messageController.handleGameEvent('CAPTURE_SUCCESS', {
    points: points,
    cardsCount: allCapturedCards.length
  });
  
  // Reset combo areas
  game.resetCombination();

  // Handle turn continuation
  const currentState = game.getState();
  if (!currentState || !currentState.hands) {
    console.error('Invalid current state in handleSubmit');
    return;
  }

  if (currentState.hands[0].length > 0) {
    game.state.currentPlayer = 0;
    window.messageController.handleGameEvent('TURN_START');
  } else {
    game.state.currentPlayer = 1;
    window.messageController.handleGameEvent('PLAYER_OUT_OF_CARDS');
    setTimeout(async () => await scheduleNextBotTurn(), 1000);
  }
  
  ui.render();
  playSound('capture');
  checkGameEnd();
}

// 🎯 UPDATED handleResetPlayArea() WITH MESSAGE EVENTS
function handleResetPlayArea() {
  if (game.state.currentPlayer !== 0) return;

  const gameState = game.getState();
  if (!gameState || !gameState.combination) {
    console.error('Invalid game state in handleResetPlayArea');
    return;
  }

  game.resetCombination();
  
  // 🎯 SEND RESET EVENT TO MESSAGE CONTROLLER
  window.messageController.handleGameEvent('RESET_COMBO');
  
  ui.render();
}

// 🎯 UPDATED handleBoardDrop() WITH CARD PLACED EVENT
function handleBoardDrop(e) {
  e.preventDefault();

  const gameState = game.getState();
  if (!gameState || !gameState.hands || !gameState.board || !gameState.combination) {
    console.error('Invalid game state in handleBoardDrop');
    return;
  }

  if (game.state.currentPlayer !== 0 || !game.state.draggedCard) return;

  if (game.state.draggedCard.slot !== undefined) {
    // Return from combo to original
    const oldSlot = game.state.draggedCard.slot;
    const comboIndex = game.state.draggedCard.comboIndex;
    const entry = gameState.combination[oldSlot][comboIndex];
    if (!entry) {
      game.state.draggedCard = null;
      ui.render();
      return;
    }
    const originalLocation = entry.originalLocation;
    const originalIndex = entry.originalIndex;
    const originalPlayerIndex = entry.originalPlayerIndex;
    game.cardManager.moveCard(entry.card.id, 'combo', originalLocation, originalIndex, originalPlayerIndex);
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
    const actualCard = gameState.hands[0][handIndex];
    if (!actualCard || actualCard.id !== handCard.id) {
      game.state.draggedCard = null;
      ui.render();
      return;
    }
    
    game.placeCard(handCard, 'hands', handIndex, 0);
    window.cardIntelligence.updateCardsSeen([handCard]);
    game.resetCombination();
    game.state.draggedCard = null;

    // 🔥 TRACK LAST ACTION - CRITICAL FOR GAME STATE MANAGER
    game.state.lastAction = 'place';
    console.log('🎯 LAST ACTION SET TO: place');
    
    // 🎯 SEND CARD PLACED EVENT TO MESSAGE CONTROLLER
    window.messageController.handleGameEvent('CARD_PLACED', {
      cardName: `${handCard.value}${handCard.suit}`
    });
    
    const playerCards = gameState.hands[0].length;
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

// Add this OUTSIDE the function:
let checkGameEndCount = 0;

// Then in checkGameEnd() function:
function checkGameEnd() {
  logGameState(++checkGameEndCount, 'checkGameEnd() called');
  
  // 🔥 USE GAME STATE MANAGER WITH CARDMANAGER
  const result = window.gameStateManager.determineGameState(game);
  
  console.log(`🎯 GAME STATE RESULT: ${result.state}`);
  
  // Handle each possible state
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
      console.error(`🚨 UNKNOWN GAME STATE: ${result.state}`);
      handleGameStateError({
        data: {
          message: `Unknown game state: ${result.state}`,
          userMessage: 'Game encountered an unknown state. Please restart.',
          technicalDetails: JSON.stringify(result, null, 2)
        }
      });
  }
}

// 🔥 FIXED: Bot Turn Flag Management - Add this to main.js around line 825

// 🔥 COMPLETELY REWRITTEN: aiTurn() - CENTRALIZED TURN MANAGEMENT
async function aiTurn() {
  // 🛡️ SAFETY GUARD: Only one bot turn at a time
  if (botTurnInProgress) {
    console.log('🚨 BOT TURN ALREADY IN PROGRESS - SKIPPING');
    return;
  }

  // 🛡️ SAFETY GUARD: Only run for bot players
  if (game.state.currentPlayer === 0) {
    console.log('🚨 AI TURN CALLED FOR HUMAN PLAYER - SKIPPING');
    return;
  }

  const playerIndex = game.state.currentPlayer;
  
  // 🛡️ SAFETY GUARD: Check if bot has cards
  const gameState = game.getState();
  if (!gameState || !gameState.hands || !gameState.hands[playerIndex] || gameState.hands[playerIndex].length === 0) {
    console.log(`🏁 BOT ${playerIndex}: No cards left, switching players`);
    game.nextPlayer();
    ui.render();
    
    // Continue to next player if they have cards
    const updatedState = game.getState();
    if (!updatedState || !updatedState.hands) {
      console.error('Invalid updated state in aiTurn');
      return;
    }

    if (game.state.currentPlayer !== 0 && 
    updatedState.hands[game.state.currentPlayer].length > 0) {
      setTimeout(() => scheduleNextBotTurn(), 1000);
    } else if (game.state.currentPlayer === 0 && updatedState.hands[0].length === 0) {
      // Player is also out of cards, find next bot with cards
      let nextBot = 1;
      while (nextBot < 3 && (!updatedState.hands[nextBot] || updatedState.hands[nextBot].length === 0)) {
        nextBot++;
      }
      if (nextBot < 3) {
        game.state.currentPlayer = nextBot;
        setTimeout(() => scheduleNextBotTurn(), 1000);
      } else {
        checkGameEnd();
      }
    }
    return;
  }

  // 🎯 SET BOT TURN FLAG
  botTurnInProgress = true;
  
  try {
    logBotTurn('START', playerIndex, { action: 'analyzing' });
    
    // Get AI decision
    const gameStateForMove = game.getState();
    if (!gameStateForMove || !gameStateForMove.hands || !gameStateForMove.board) {
      console.error('Invalid game state for move in aiTurn');
      botTurnInProgress = false;
      return;
    }
    const move = aiMove(gameStateForMove.hands[playerIndex], gameStateForMove.board, gameStateForMove.settings.botDifficulty);
    
    let result;
    
    if (move && move.action === 'capture') {
      console.log(`🤖 BOT ${playerIndex}: Attempting capture`);
      result = await botModal.executeCapture(move, playerIndex);
    } else {
      const cardToPlace = move ? move.handCard : gameStateForMove.hands[playerIndex][0];
      console.log(`🤖 BOT ${playerIndex}: Placing card ${cardToPlace.value}${cardToPlace.suit}`);
      result = await botModal.placeCard(cardToPlace, playerIndex);
    }
    
    // 🔥 CRITICAL FIX: ALWAYS CLEAR BOT TURN FLAG BEFORE BRANCHING LOGIC
    botTurnInProgress = false;
    console.log('🔥 BOT TURN FLAG CLEARED AFTER ACTION');
    
    // 🎯 HANDLE RESULT AND MANAGE TURNS
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
        const currentState = game.getState();
        if (!currentState || !currentState.hands) {
          console.error('Invalid current state after capture in aiTurn');
          return;
        }
        const remainingCards = currentState.hands[playerIndex].length;
        if (remainingCards > 0) {
          console.log(`🔄 BOT ${playerIndex}: Has ${remainingCards} cards left, continuing turn`);
          setTimeout(() => scheduleNextBotTurn(), 1500);
        } else {
          console.log(`🏁 BOT ${playerIndex}: Out of cards after capture`);
          game.nextPlayer();
          ui.render();
          
          // Schedule next bot turn if current player is a bot
          const updatedState = game.getState();
          if (!updatedState || !updatedState.hands) {
            console.error('Invalid updated state after capture out-of-cards in aiTurn');
            return;
          }
          if (game.state.currentPlayer !== 0 && 
    updatedState.hands[game.state.currentPlayer].length > 0) {
            console.log(`🤖 SCHEDULING NEXT BOT ${game.state.currentPlayer} AFTER OUT-OF-CARDS`);
            setTimeout(() => scheduleNextBotTurn(), 1000);
          } else {
            // All players out or it's human turn - check game state
            setTimeout(() => checkGameEnd(), 100);
          }
        }
      } else if (result.action === 'place') {
        // Bot placed card, switch to next player
        console.log(`🔄 BOT ${playerIndex}: Placed card, switching players`);
        
        // Update current player BEFORE calling checkGameEnd
        game.nextPlayer();
        ui.render();
        
        console.log(`🎯 AFTER PLACE: Current player is now ${game.state.currentPlayer}`);
        
        // Handle next player logic
        if (game.state.currentPlayer !== 0) {
          console.log(`🤖 NEXT PLAYER IS BOT ${game.state.currentPlayer} - SCHEDULING TURN`);
          setTimeout(() => scheduleNextBotTurn(), 1000);
        } else {
          console.log(`👤 HUMAN PLAYER'S TURN - SENDING TURN START EVENT`);
          // Send turn start event for human
          window.messageController.handleGameEvent('TURN_START');
        }
      }
    } else {
      console.error(`🚨 BOT ${playerIndex}: Action failed - ${result.reason}`);
      // Fallback: place first card
      const fallbackState = game.getState();
      if (!fallbackState || !fallbackState.hands) {
        console.error('Invalid fallback state in aiTurn');
        return;
      }
      const fallbackCard = fallbackState.hands[playerIndex][0];
      if (fallbackCard) {
        console.log(`🔄 BOT ${playerIndex}: Fallback - placing first card`);
        result = await botModal.placeCard(fallbackCard, playerIndex);
        if (result.success) {
          game.nextPlayer();
          ui.render();
          checkGameEnd();
        }
      }
    }
    
  } catch (error) {
    console.error(`🚨 CRITICAL ERROR in aiTurn for Bot ${playerIndex}:`, error);
    // 🔥 CRITICAL: Always clear flag on error
    botTurnInProgress = false;
    console.log('🔥 BOT TURN FLAG CLEARED AFTER ERROR');
    
    // Emergency fallback: switch to next player
    game.nextPlayer();
    ui.render();
  }
}

async function scheduleNextBotTurn() {
  // 🛡️ SAFETY GUARD: Prevent duplicate scheduling
  if (botTurnInProgress) {
    console.log('🚨 BOT TURN ALREADY SCHEDULED - SKIPPING');
    return;
  }
  
  // 🛡️ SAFETY GUARD: Only for bot players
  if (game.state.currentPlayer === 0) {
    console.log('🚨 SCHEDULE CALLED FOR HUMAN PLAYER - SKIPPING');
    return;
  }
  
  // 🔥 CRITICAL FIX: Use CardManager data access
  const gameState = game.getState();
  if (!gameState || !gameState.hands || !gameState.hands[game.state.currentPlayer]) {
    console.log(`🚨 BOT ${game.state.currentPlayer}: CardManager hands missing - CALLING checkGameEnd()`);
    setTimeout(() => {
      console.log(`🎯 CALLING checkGameEnd() because CardManager hands are missing`);
      checkGameEnd();
    }, 100);
    return;
  }

  if (gameState.hands[game.state.currentPlayer].length === 0) {
    console.log(`🚨 BOT ${game.state.currentPlayer}: No cards to schedule turn - CALLING checkGameEnd()`);
    setTimeout(() => {
      console.log(`🎯 CALLING checkGameEnd() because Bot ${game.state.currentPlayer} has no cards`);
      checkGameEnd();
    }, 100);
    return;
  }
  
  console.log(`⏰ SCHEDULING: Bot ${game.state.currentPlayer} turn in 1000ms`);
  
  setTimeout(async () => {
    console.log(`🤖 EXECUTING SCHEDULED TURN for Bot ${game.state.currentPlayer}`);
    await aiTurn();
  }, 1000);
}

function playSound(type) {
  if (game.state.settings.soundEffects === 'on' && window.sounds && window.sounds[type]) {
    window.sounds[type].play().catch(e => console.error('Sound play failed:', e));
  }
}

// Drag and drop handlers
function handleDragStart(e, source, index) {
  // 🔥 NEW: Block all interactions during modals
  if (window.gameIsPaused || (ui && ui.modalManager && ui.modalManager.isModalActive)) {
    e.preventDefault();
    console.log('🚨 BLOCKING DRAG: Game is paused or modal is active');
    return;
  }
  
  if (game.state.currentPlayer !== 0) return;

  const gameState = game.getState();
  if (!gameState || !gameState.hands || !gameState.board) {
    console.error('Invalid game state in handleDragStart');
    return;
  }

  const card = source === 'hand' ? gameState.hands[0][index] : gameState.board[index];
  if (!card) {
    console.error('Invalid card in handleDragStart');
    return;
  }
  game.state.draggedCard = { 
  source, 
  index, 
  card
};
}

function handleDragStartCombo(e, slot, comboIndex) {
  if (game.state.currentPlayer !== 0) return;

  const gameState = game.getState();
  if (!gameState || !gameState.combination) {
    console.error('Invalid game state in handleDragStartCombo');
    return;
  }

  const entry = gameState.combination[slot][comboIndex];
  if (!entry) {
    console.error('Invalid combo entry in handleDragStartCombo');
    return;
  }
  game.state.draggedCard = entry;
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
  
  if (window.gameIsPaused || (ui && ui.modalManager && ui.modalManager.isModalActive)) {
    console.log('🚨 BLOCKING DROP: Game is paused or modal is active');
    return;
  }
  
  if (game.state.currentPlayer !== 0) {
    console.log('🚨 BLOCKING DROP: Bot turn in progress');
    return;
  }
  
  if (!game.state.draggedCard) return;

  const gameState = game.getState();
  if (!gameState || !gameState.combination) {
    console.error('Invalid game state in handleDrop');
    return;
  }

  // Handle removal from old slot if coming from combo
  if (game.state.draggedCard.slot !== undefined) {
    game.removeFromCombination(game.state.draggedCard.slot, game.state.draggedCard.comboIndex);
  }

  // Handle base replacement
  if (slot === 'base' && gameState.combination.base.length > 0) {
    const existingBase = gameState.combination.base[0];
    game.removeFromCombination('base', 0); // Remove old base
    if (gameState.combination.sum1.length === 0) {
      game.addToCombination('sum1', existingBase);
    } else if (gameState.combination.sum2.length === 0) {
      game.addToCombination('sum2', existingBase);
    } else if (gameState.combination.sum3.length === 0) {
      game.addToCombination('sum3', existingBase);
    } else {
      game.addToCombination('match', existingBase);
    }
  }

  // Add to new combo area
  const currentPlayer = game.state.currentPlayer;
  const entry = {
    source: game.state.draggedCard.source,
    index: game.state.draggedCard.index,
    card: game.state.draggedCard.card,
    playerSource: currentPlayer,
    fromBot: currentPlayer !== 0
  };
  game.addToCombination(slot, entry);

  game.state.draggedCard = null;
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

  const gameState = game.getState();
  if (!gameState || !gameState.combination) {
    console.error('Invalid game state in handleDropOriginal');
    return;
  }

  if (game.state.draggedCard.slot !== undefined) {
    const oldSlot = game.state.draggedCard.slot;
    const comboIndex = game.state.draggedCard.comboIndex;
    game.removeFromCombination(oldSlot, comboIndex);
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
  if (game.state.currentPlayer !== 0) {
    console.log('🚫 HINT: Not player turn');
    return;
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
  const playerIndex = result.nextPlayer;
  console.log(`✅ CONTINUE TURN: Player ${playerIndex} has cards`);
  
  // Set the current player
  game.state.currentPlayer = playerIndex;
  
  // Update UI
  ui.render();
  
  // Send turn start event to message controller
  window.messageController.handleGameEvent('TURN_START');
  
  // If it's a bot, schedule their turn
  if (playerIndex !== 0) {
    console.log(`🤖 SCHEDULING BOT ${playerIndex} TURN`);
    setTimeout(() => scheduleNextBotTurn(), 1000);
  }
}

// 🎴 DEAL NEW HAND - Same dealer, same starting player
function handleDealNewHand(result) {
  console.log(`✅ DEAL NEW HAND: Deck has ${result.data.deckSize} cards`);
  
  try {
    const gameState = game.getState();
    if (!gameState || !gameState.deck) {
      console.error('Invalid game state in handleDealNewHand');
      return;
    }
    // Deal new cards using CardManager
    game.cardManager.dealCards(3, 4, 0);
    
    // Keep same starting player as beginning of round
    game.state.currentPlayer = result.data.startingPlayer;
    game.state.lastCapturer = null;
    
    console.log(`🎮 NEW HAND DEALT - Starting player: ${['Player', 'Bot 1', 'Bot 2'][result.data.startingPlayer]}`);
    
    // Send new hand event to message controller
    window.messageController.handleGameEvent('NEW_HAND', {
  handNumber: Math.floor((52 - gameState.deck.length) / 12),
  roundNumber: game.currentRound
});
    
    // Update UI
    ui.render();
    
    // If starting player is a bot, schedule their turn
    if (result.data.startingPlayer !== 0) {
      console.log(`🤖 NEW HAND STARTS WITH BOT ${result.data.startingPlayer} - SCHEDULING TURN`);
      setTimeout(() => scheduleNextBotTurn(), 1000);
    }
    
  } catch (error) {
    console.error('🚨 ERROR DEALING NEW HAND:', error);
    window.messageController.handleGameEvent('CAPTURE_ERROR', {
      message: 'Error dealing new hand! Please restart the game.'
    });
  }
}

// 🔄 END ROUND - Apply jackpot and show modal (PHASE 1 ONLY)
function handleEndRound(result) {
  console.log(`✅ END ROUND: Moving to round ${result.data.newRound}`);
  
  // PHASE 1: Apply jackpot and show modal - NO SETUP
  if (result.data.jackpot.hasJackpot) {
    console.log(`🏆 APPLYING JACKPOT: ${result.data.jackpot.message}`);
    
    // Apply jackpot to game engine scores
    const jackpot = result.data.jackpot;
    game.addScore(jackpot.winner, jackpot.points);
    game.addOverallScore(jackpot.winner, jackpot.points);
    
    // Clear the board after jackpot by moving to captured
    const gameState = game.getState();
    if (!gameState || !gameState.board) {
      console.error('Invalid game state in handleEndRound');
      return;
    }
    const boardCardIds = gameState.board.map(card => card.id);
    game.cardManager.executeCapture(boardCardIds);
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
function resumeNextRound(roundData) {
  console.log(`🔄 RESUMING ROUND ${roundData.newRound} AFTER CONTINUE`);
  
  // Create new deck for new round
  game.cardManager.initializeDeck();
  console.log(`🔄 NEW DECK CREATED FOR ROUND ${roundData.newRound}: ${game.getState().deck.length} cards`);

  // Set up new round properly
  const newStartingPlayer = (roundData.newDealer + 1) % 3;
  game.state.currentPlayer = newStartingPlayer;

  // Deal new cards from fresh deck
  game.cardManager.dealCards(3, 4, 4);

  const gameState = game.getState();
  console.log(`🎮 NEW ROUND SETUP: Dealer=${roundData.newDealer}, Starting=${newStartingPlayer}, Current=${game.state.currentPlayer}`);
  console.log(`🎮 NEW CARDS DEALT: Hands=[${gameState.hands.map(h => h.length)}], Board=${gameState.board.length}, Deck=${gameState.deck.length}`);

  // Apply round and dealer from GameStateManager
  game.currentRound = roundData.newRound;
  game.currentDealer = roundData.newDealer;
  
  console.log(`🔄 DEALER ROTATED: ${['Player', 'Bot 1', 'Bot 2'][roundData.oldDealer]} → ${['Player', 'Bot 1', 'Bot 2'][roundData.newDealer]}`);
  
  // Update UI after setup
  ui.render();

  // Schedule first turn if starting player is bot
  if (newStartingPlayer !== 0) {
    console.log(`🤖 SCHEDULING BOT ${newStartingPlayer} TURN AFTER RESUME`);
    setTimeout(() => scheduleNextBotTurn(), 1000);
  }
}

// 🏆 END GAME - Show game over modal
function handleEndGame(result) {
  console.log(`✅ END GAME: ${result.data.winnerName} wins with ${result.data.winnerScore} points!`);
  
  // Apply jackpot to game scores if it exists
  if (result.data.jackpot.hasJackpot) {
    console.log(`🏆 FINAL JACKPOT: ${result.data.jackpot.message}`);
    
    // Apply jackpot to game engine scores
    const jackpot = result.data.jackpot;
    game.addScore(jackpot.winner, jackpot.points);
    game.addOverallScore(jackpot.winner, jackpot.points);
    
    // Clear the board after jackpot by moving to captured
    const gameState = game.getState();
    if (!gameState || !gameState.board) {
      console.error('Invalid game state in handleEndGame');
      return;
    }
    const boardCardIds = gameState.board.map(card => card.id);
    game.cardManager.executeCapture(boardCardIds);
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
function handleGameStateError(result) {
  console.error(`🚨 GAME STATE ERROR: ${result.data.message}`);
  console.error(`🔍 TECHNICAL DETAILS:`, result.data.technicalDetails);
  
  // 🔥 NEW: Use centralized modal system
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

// 🔥 OVERRIDE OLD MODAL FUNCTIONS TO USE NEW CENTRALIZED SYSTEM
function showRoundEndModal(data) {
  console.log('🔄 REDIRECTING OLD ROUND END MODAL TO NEW SYSTEM');
  
  // Convert old data format to new format if needed
  const modalData = {
    scores: data.scores || game.state.scores,
    jackpot: { 
      hasJackpot: data.message ? true : false,
      message: data.message,
      winnerName: data.message ? data.message.split(' ')[1] : null,
      points: data.message ? parseInt(data.message.match(/\+(\d+)/)?.[1]) : 0
    },
    newRound: data.newRound || game.currentRound,
    oldDealer: game.currentDealer === 0 ? 2 : game.currentDealer - 1,
    newDealer: game.currentDealer
  };
  
  ui.showModal('round_end', modalData);
}

function showGameOverModal(data) {
  console.log('🔄 REDIRECTING OLD GAME OVER MODAL TO NEW SYSTEM');
  
  // Convert old data format to new format if needed  
  const modalData = {
    scores: data.scores || game.state.scores,
    jackpot: { 
      hasJackpot: data.message ? true : false,
      message: data.message,
      winnerName: data.message ? data.message.split(' ')[1] : null,
      points: data.message ? parseInt(data.message.match(/\+(\d+)/)?.[1]) : 0
    },
    winner: data.winner || 0,
    winnerName: data.winner || 'Player',
    winnerScore: data.winnerScore || 0
  };
  
  ui.showModal('game_over', modalData);
}

// 🔥 ENSURE GLOBAL VARIABLES ARE SET
window.gameIsPaused = false;
// Make resumeNextRound globally available
window.resumeNextRound = resumeNextRound;