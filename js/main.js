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
  const board = this.game.state.board;

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
  const targetCards = capture.cards.map(cardIndex => {
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
    setTimeout(async () => await scheduleNextBotTurn(), 1000);
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

// 🔥 CLEAN: checkGameEnd() - NO MORE GUARD NEEDED!
function checkGameEnd() {
  const endResult = game.checkGameEnd();
  
  if (endResult.gameOver) {
    if (game.currentMode.onGameEnd) {
      game.currentMode.onGameEnd(game);
    }
    showGameOverModal(endResult);
  } else if (endResult.roundOver) {
    if (game.currentMode.onRoundEnd) {
      game.currentMode.onRoundEnd(game);
    }
    showRoundEndModal(endResult);
  } else if (endResult.continueRound) {
    dealNewCards();
  }
}

// 🎯 FIXED dealNewCards() - REMOVED EXTRA checkGameEnd() CALL
function dealNewCards() {
  try {
    // 🔥 CRITICAL FIX: Remove the extra checkGameEnd() call here!
    // The game end should be handled by the calling function, not here
    if (game.state.deck.length < 12) {
      console.log(`🎯 DECK TOO LOW: ${game.state.deck.length} cards - letting calling function handle game end`);
      return; // Just return, don't call checkGameEnd() here!
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
  if (!game.state.hands[playerIndex] || game.state.hands[playerIndex].length === 0) {
    console.log(`🏁 BOT ${playerIndex}: No cards left, switching players`);
    game.nextPlayer();
    ui.render();
    
    // Continue to next player if they have cards
    if (game.state.currentPlayer !== 0 && 
        game.state.hands[game.state.currentPlayer] && 
        game.state.hands[game.state.currentPlayer].length > 0) {
      setTimeout(() => scheduleNextBotTurn(), 1000);
    } else if (game.state.currentPlayer === 0 && game.state.hands[0].length === 0) {
      // Player is also out of cards, find next bot with cards
      let nextBot = 1;
      while (nextBot < 3 && (!game.state.hands[nextBot] || game.state.hands[nextBot].length === 0)) {
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
    console.log(`🤖 BOT ${playerIndex}: Starting turn with ${game.state.hands[playerIndex].length} cards`);
    
    // Get AI decision
    const move = aiMove(game.state.hands[playerIndex], game.state.board, game.state.settings.botDifficulty);
    
    let result;
    
    if (move && move.action === 'capture') {
      console.log(`🤖 BOT ${playerIndex}: Attempting capture`);
      result = await botModal.executeCapture(move, playerIndex);
    } else {
      const cardToPlace = move ? move.handCard : game.state.hands[playerIndex][0];
      console.log(`🤖 BOT ${playerIndex}: Placing card ${cardToPlace.value}${cardToPlace.suit}`);
      result = await botModal.placeCard(cardToPlace, playerIndex);
    }
    
    // 🎯 HANDLE RESULT AND MANAGE TURNS
    if (result.success) {
      console.log(`✅ BOT ${playerIndex}: Action succeeded - ${result.action}`);
      
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
        if (remainingCards > 0) {
          console.log(`🔄 BOT ${playerIndex}: Has ${remainingCards} cards left, continuing turn`);
          botTurnInProgress = false;
          setTimeout(() => scheduleNextBotTurn(), 1500);
        } else {
          console.log(`🏁 BOT ${playerIndex}: Out of cards after capture`);
          game.nextPlayer();
          ui.render();
          botTurnInProgress = false;
          
          if (game.state.currentPlayer !== 0 && 
              game.state.hands[game.state.currentPlayer] && 
              game.state.hands[game.state.currentPlayer].length > 0) {
            setTimeout(() => scheduleNextBotTurn(), 1000);
          }
        }
      } else if (result.action === 'place') {
        // Bot placed card, switch to next player
        console.log(`🔄 BOT ${playerIndex}: Placed card, switching players`);
        game.nextPlayer();
        ui.render();
        checkGameEnd();
        botTurnInProgress = false;
        
        if (game.state.currentPlayer !== 0 && 
            game.state.hands[game.state.currentPlayer] && 
            game.state.hands[game.state.currentPlayer].length > 0) {
          setTimeout(() => scheduleNextBotTurn(), 1000);
        }
      }
    } else {
      console.error(`🚨 BOT ${playerIndex}: Action failed - ${result.reason}`);
      // Fallback: place first card
      const fallbackCard = game.state.hands[playerIndex][0];
      if (fallbackCard) {
        console.log(`🔄 BOT ${playerIndex}: Fallback - placing first card`);
        result = await botModal.placeCard(fallbackCard, playerIndex);
        if (result.success) {
          game.nextPlayer();
          ui.render();
          checkGameEnd();
        }
      }
      botTurnInProgress = false;
    }
    
  } catch (error) {
    console.error(`🚨 CRITICAL ERROR in aiTurn for Bot ${playerIndex}:`, error);
    botTurnInProgress = false;
    
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
  
  // 🛡️ SAFETY GUARD: Check if current bot has cards
if (!game.state.hands[game.state.currentPlayer] || 
    game.state.hands[game.state.currentPlayer].length === 0) {
  console.log(`🚨 BOT ${game.state.currentPlayer}: No cards to schedule turn`);
  
  // 🔥 CRITICAL FIX: Call checkGameEnd() properly
  setTimeout(() => {
    console.log(`🎯 CALLING checkGameEnd() because Bot ${game.state.currentPlayer} has no cards`);
    checkGameEnd();
  }, 100);
  return;
}
  
  console.log(`⏰ SCHEDULING: Bot ${game.state.currentPlayer} turn in 1000ms`);
  
  // 🔥 CRITICAL FIX: Make sure aiTurn actually gets called!
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

// Initialize the game
initGame();