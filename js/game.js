/* 
 * 🔥 GAMEENGINE - CARDMANAGER INTEGRATION
 * Phase 2: Replace all card arrays with CardManager single source of truth
 * BULLETPROOF: Cards can never disappear again!
 */

class GameEngine {
  constructor() {
    // 🔥 NEW: CardManager is the ONLY source of card data
    this.cardManager = new CardManager();
    
    // 🎯 GAME STATE: No more card arrays - only game logic data
    this.state = {
      // ❌ REMOVED: deck, board, hands, combination (CardManager handles these)
      scores: { player: 0, bot1: 0, bot2: 0 }, // Current round scores
      overallScores: { player: 0, bot1: 0, bot2: 0 }, // Accumulated scores
      currentPlayer: 0,
      settings: {
        cardSpeed: 'fast',
        soundEffects: 'off',
        targetScore: 500,
        botDifficulty: 'intermediate'
      },
      draggedCard: null,
      selectedCard: null,
      lastCapturer: null,
      lastAction: null // For GameStateManager
    };
    
    this.currentMode = null;
    this.currentRound = 1;
    this.currentDealer = 0;
    this.botTurnInProgress = false;
    
    console.log('🎮 GAMEENGINE INITIALIZED WITH CARDMANAGER!');
  }

  // 🎯 INITIALIZE GAME WITH CARDMANAGER
  initGame(gameMode, settings = {}) {
    console.log(`🎮 Initializing ${gameMode.name} with CardManager`);
    
    // Set current mode
    this.currentMode = gameMode;
    
    // Apply mode settings
    Object.assign(this.state.settings, settings);
    
    // 🔥 NEW: Use CardManager for all card operations
    this.cardManager.reset();
    this.cardManager.initializeDeck();
    this.cardManager.shuffleDeck();
    this.cardManager.dealCards(3, 4, 4); // 3 players, 4 cards each, 4 to board
    
    // Reset game state (no more card arrays!)
    this.state.scores = { player: 0, bot1: 0, bot2: 0 };
    this.state.draggedCard = null;
    this.state.selectedCard = null;
    this.state.lastCapturer = null;
    this.state.lastAction = null;
    this.currentRound = 1;
    this.currentDealer = Math.floor(Math.random() * 3);
    
    // Set proper starting player based on dealer
    this.setStartingPlayer();
    
    // Initialize mode
    if (this.currentMode.init) {
      this.currentMode.init(this);
    }
    
    console.log(`🎮 ${gameMode.name} initialized with CardManager successfully`);
    this.cardManager.validateCardCount('GAME_INITIALIZATION');
  }

  // 🔥 NEW: Get current game state (CardManager + game logic)
  getState() {
    const cardState = this.cardManager.getGameState();
    
    return {
      // 🔥 CARD DATA: From CardManager (single source of truth)
      deck: cardState.deck,
      hands: cardState.hands,
      board: cardState.board,
      combination: cardState.combo,
      capturedCards: cardState.captured,
      
      // 🎯 GAME LOGIC: From GameEngine
      scores: { ...this.state.scores },
      overallScores: { ...this.state.overallScores },
      currentPlayer: this.state.currentPlayer,
      settings: { ...this.state.settings },
      draggedCard: this.state.draggedCard,
      selectedCard: this.state.selectedCard,
      lastCapturer: this.state.lastCapturer,
      lastAction: this.state.lastAction
    };
  }
  
  // 🔥 NEW: BULLETPROOF EXECUTE CAPTURE
  executeCapture(baseCard, validCaptures, allCapturedCards) {
    console.log(`🎯 EXECUTING CAPTURE VIA CARDMANAGER - ${allCapturedCards.length} cards`);
    
    // 🛡️ VALIDATION: Verify all cards exist
    const cardIds = allCapturedCards.map(card => card.id);
    for (const cardId of cardIds) {
      if (!this.cardManager.getCardById(cardId)) {
        throw new Error(`CRITICAL: Card ${cardId} not found in CardManager!`);
      }
    }
    
    // 🔥 ATOMIC CAPTURE: Move all cards to captured pile
    const capturedIds = this.cardManager.executeCapture(cardIds);
    
    // Calculate and apply score
    const points = this.calculateScore(allCapturedCards);
    this.addScore(this.state.currentPlayer, points);
    this.addOverallScore(this.state.currentPlayer, points);
    this.state.lastCapturer = this.state.currentPlayer;
    this.state.lastAction = 'capture';
    
    console.log(`✅ CAPTURE COMPLETE VIA CARDMANAGER: ${capturedIds.length} cards, ${points} points`);
    
    // 🔥 PERFECT VALIDATION
    this.cardManager.validateCardCount('CAPTURE_EXECUTION');
    
    return capturedIds;
  }
  
  // 🔥 NEW: CARD PLACEMENT VIA CARDMANAGER
  placeCard(card, fromLocation, fromIndex = null, playerIndex = null) {
    console.log(`🃏 PLACING CARD VIA CARDMANAGER: ${card.displayName || card.value + card.suit}`);
    
    // Move card from source to board
    this.cardManager.moveCard(card.id, fromLocation, 'board', null, playerIndex);
    
    this.state.lastAction = 'place';
    
    console.log(`✅ CARD PLACED VIA CARDMANAGER`);
    this.cardManager.validateCardCount('CARD_PLACEMENT');
  }
  
  // 🔥 NEW: COMBO AREA MANAGEMENT
  addToComboArea(card, comboArea, fromLocation, fromIndex = null, playerIndex = null) {
    console.log(`🎪 ADDING TO COMBO VIA CARDMANAGER: ${card.displayName || card.value + card.suit} → ${comboArea}`);
    
    // For combo areas, we use the specialized function
    this.cardManager.addToComboArea(card.id, comboArea);
    
    console.log(`✅ ADDED TO COMBO VIA CARDMANAGER`);
    this.cardManager.validateCardCount('COMBO_ADDITION');
  }
  
  // 🔥 NEW: CLEAR COMBO AREAS
  clearComboAreas() {
    console.log('🧹 CLEARING COMBO AREAS VIA CARDMANAGER');
    
    const comboState = this.cardManager.getCardsInLocation('combo');
    const allComboCards = [
      ...comboState.base,
      ...comboState.sum1,
      ...comboState.sum2,
      ...comboState.sum3,
      ...comboState.match
    ];
    
    // Return each card to its original location
    allComboCards.forEach(comboEntry => {
      const card = comboEntry.card;
      const originalLocation = comboEntry.originalLocation;
      const originalIndex = comboEntry.originalIndex;
      const originalPlayerIndex = comboEntry.originalPlayerIndex;
      
      this.cardManager.moveCard(card.id, 'combo', originalLocation, originalIndex, originalPlayerIndex);
    });
    
    console.log(`✅ COMBO AREAS CLEARED VIA CARDMANAGER`);
    this.cardManager.validateCardCount('COMBO_CLEAR');
  }

  // 🎯 VALIDATION: CardManager integration
  validateCapture(areaCards, baseValue, baseCard, areaName) {
    // Check if mode has custom validation
    if (this.currentMode.validateCapture) {
      const modeResult = this.currentMode.validateCapture(areaCards, baseValue, baseCard, areaName);
      if (modeResult !== null) {
        return modeResult;
      }
    }
    
    // Use standard validation
    return this.standardValidateCapture(areaCards, baseValue, baseCard, areaName);
  }

  // Standard validation logic (unchanged - works with CardManager data)
  standardValidateCapture(areaCards, baseValue, baseCard, areaName) {
    // 🔥 ENHANCED: Validate cards exist in CardManager
    const hasHandCard = areaCards.some(entry => {
      const cardData = this.cardManager.getCardById(entry.card.id);
      return cardData && (cardData.location === 'hands' || entry.source === 'hand');
    }) || (baseCard.source === 'hand');
    
    const hasBoardCard = areaCards.some(entry => {
      const cardData = this.cardManager.getCardById(entry.card.id);
      return cardData && (cardData.location === 'board' || entry.source === 'board');
    }) || (baseCard.source === 'board');
    
    if (!hasHandCard || !hasBoardCard) {
      return { isValid: false, details: "Requires hand + board cards" };
    }

    // Try both pair and sum validation
    const pairResult = this.validatePairLogic(areaCards, baseCard);
    const sumResult = this.validateSumLogic(areaCards, baseCard);
    
    if (pairResult.isValid) {
      return { 
        isValid: true, 
        details: `PAIR: ${pairResult.details}`,
        captureType: 'pair'
      };
    } else if (sumResult.isValid) {
      return { 
        isValid: true, 
        details: `SUM: ${sumResult.details}`,
        captureType: 'sum'
      };
    } else {
      return { 
        isValid: false, 
        details: `Not valid as pair (${pairResult.details}) or sum (${sumResult.details})`
      };
    }
  }

  validatePairLogic(areaCards, baseCard) {
    const allMatch = areaCards.every(entry => entry.card.value === baseCard.card.value);
    
    if (allMatch) {
      return { 
        isValid: true, 
        details: `${areaCards.length + 1} cards matching ${baseCard.card.value}` 
      };
    } else {
      return { 
        isValid: false, 
        details: "Cards don't match base card value" 
      };
    }
  }

  validateSumLogic(areaCards, baseCard) {
    // Face cards cannot be used in sum captures
    if (['J', 'Q', 'K'].includes(baseCard.card.value)) {
      return { isValid: false, details: "Face cards can't be used in sum captures" };
    }

    const hasFaceCards = areaCards.some(entry => ['J', 'Q', 'K'].includes(entry.card.value));
    if (hasFaceCards) {
      return { isValid: false, details: "Face cards can't be used in sums" };
    }

    const areaValues = areaCards.map(entry => 
      entry.card.value === 'A' ? 1 : parseInt(entry.card.value)
    );
    const totalSum = areaValues.reduce((a, b) => a + b, 0);
    const baseNumValue = baseCard.card.value === 'A' ? 1 : parseInt(baseCard.card.value);

    if (totalSum === baseNumValue) {
      return { 
        isValid: true, 
        details: `${areaValues.join(' + ')} = ${baseNumValue}` 
      };
    } else {
      return { 
        isValid: false, 
        details: `${areaValues.join(' + ')} = ${totalSum} ≠ ${baseNumValue}` 
      };
    }
  }

  // Calculate score using current mode (unchanged)
  calculateScore(cards) {
    if (this.currentMode.calculateScore) {
      return this.currentMode.calculateScore(cards);
    }
    
    // Default scoring
    const pointsMap = {
      'A': 15, 'K': 10, 'Q': 10, 'J': 10, '10': 10,
      '9': 5, '8': 5, '7': 5, '6': 5, '5': 5, '4': 5, '3': 5, '2': 5
    };
    return cards.reduce((total, card) => total + (pointsMap[card.value] || 0), 0);
  }

  // Add score to current round (unchanged)
  addScore(playerIndex, points) {
    if (playerIndex === 0) {
      this.state.scores.player += points;
      console.log(`🎯 PLAYER SCORED: +${points} pts (Round Total: ${this.state.scores.player})`);
    } else if (playerIndex === 1) {
      this.state.scores.bot1 += points;
      console.log(`🎯 BOT 1 SCORED: +${points} pts (Round Total: ${this.state.scores.bot1})`);
    } else if (playerIndex === 2) {
      this.state.scores.bot2 += points;
      console.log(`🎯 BOT 2 SCORED: +${points} pts (Round Total: ${this.state.scores.bot2})`);
    }
  }

  // Add score to overall total (unchanged)
  addOverallScore(playerIndex, points) {
    if (playerIndex === 0) {
      this.state.overallScores.player += points;
      console.log(`🎯 PLAYER OVERALL: +${points} pts (Total: ${this.state.overallScores.player})`);
    } else if (playerIndex === 1) {
      this.state.overallScores.bot1 += points;
      console.log(`🎯 BOT 1 OVERALL: +${points} pts (Total: ${this.state.overallScores.bot1})`);
    } else if (playerIndex === 2) {
      this.state.overallScores.bot2 += points;
      console.log(`🎯 BOT 2 OVERALL: +${points} pts (Total: ${this.state.overallScores.bot2})`);
    }
  }

  // 🔥 NEW: Smart nextPlayer with CardManager
  nextPlayer() {
    let attempts = 0;
    const maxAttempts = 3;
    
    do {
      this.state.currentPlayer = (this.state.currentPlayer + 1) % 3;
      attempts++;
      
      // 🔥 NEW: Check hands via CardManager
      const currentPlayerHand = this.cardManager.getCardsInLocation('hands', this.state.currentPlayer);
      
      console.log(`🔄 NEXT PLAYER: ${this.state.currentPlayer} (Hand: ${currentPlayerHand.length} cards)`);
      
      // If current player has cards, we're good!
      if (currentPlayerHand.length > 0) {
        return;
      }
      
      // 🔥 NEW: Check total cards via CardManager
      const allHands = this.cardManager.getCardsInLocation('hands');
      const totalCards = allHands[0].length + allHands[1].length + allHands[2].length;
      
      if (totalCards === 0) {
        console.log(`📋 ALL PLAYERS OUT OF CARDS - ROUND COMPLETE`);
        // Call checkGameEnd with delay
        setTimeout(() => {
          if (typeof checkGameEnd === 'function') {
            checkGameEnd();
          } else {
            console.error('🚨 checkGameEnd function not available!');
          }
        }, 100);
        return;
      }
      
    } while (attempts < maxAttempts);
    
    console.log(`🚨 SAFETY FALLBACK: No players with cards found, ending round`);
  }

  // Set starting player based on current dealer (unchanged)
  setStartingPlayer() {
    this.state.currentPlayer = (this.currentDealer + 1) % 3;
    
    const playerNames = ['Player', 'Bot 1', 'Bot 2'];
    console.log(`🎯 DEALER: ${playerNames[this.currentDealer]}`);
    console.log(`🎯 STARTING PLAYER: ${playerNames[this.state.currentPlayer]} (left of dealer)`);
  }

  // 🔥 NEW: Check game end with CardManager
  checkGameEnd() {
    if (this.currentMode.checkEndCondition) {
      return this.currentMode.checkEndCondition(this);
    }
    
    // 🔥 NEW: Check via CardManager
    const allHands = this.cardManager.getCardsInLocation('hands');
    const playersWithCards = allHands.filter(hand => hand.length > 0).length;
    
    if (playersWithCards === 0) {
      const deckCards = this.cardManager.getCardsInLocation('deck');
      console.log(`🎯 ALL PLAYERS OUT OF CARDS - Deck: ${deckCards.length} cards remaining`);
      
      if (deckCards.length === 0) {
        console.log(`🏆 DECK IS EMPTY - APPLYING JACKPOT AND ENDING GAME!`);
        
        // Apply "Last Combo Takes All" rule
        let jackpotMessage = null;
        const boardCards = this.cardManager.getCardsInLocation('board');
        
        if (this.state.lastCapturer !== null && boardCards.length > 0) {
          const bonusPoints = this.calculateScore(boardCards);
          this.addScore(this.state.lastCapturer, bonusPoints);
          this.addOverallScore(this.state.lastCapturer, bonusPoints);
          
          const playerNames = ['Player', 'Bot 1', 'Bot 2'];
          const lastCapturerName = playerNames[this.state.lastCapturer];
          
          jackpotMessage = `🏆 ${lastCapturerName} sweeps ${boardCards.length} remaining cards! +${bonusPoints} pts`;
          console.log(`🏆 LAST COMBO TAKES ALL: ${jackpotMessage}`);
          
          // 🔥 NEW: Clear board via CardManager (move to captured)
          const boardCardIds = boardCards.map(card => card.id);
          this.cardManager.executeCapture(boardCardIds);
        }
        
        // Check if anyone reached target score
        const maxScore = Math.max(this.state.scores.player, this.state.scores.bot1, this.state.scores.bot2);
        if (maxScore >= this.state.settings.targetScore) {
          return { 
            gameOver: true, 
            reason: 'target_score_reached',
            message: jackpotMessage 
          };
        } else {
          return { 
            gameOver: true, 
            reason: 'deck_empty',
            message: jackpotMessage 
          };
        }
      } else {
        // Deck has cards, deal new round
        console.log(`🎮 DECK HAS ${deckCards.length} CARDS - DEALING NEW ROUND`);
        return { 
          continueRound: true, 
          reason: 'new_round' 
        };
      }
    }
    
    return { continue: true };
  }

  // Get ranked players (unchanged)
  getRankedPlayers() {
    const players = [
      { name: 'Player', score: this.state.scores.player, index: 0, overall: this.state.overallScores.player },
      { name: 'Bot 1', score: this.state.scores.bot1, index: 1, overall: this.state.overallScores.bot1 },
      { name: 'Bot 2', score: this.state.scores.bot2, index: 2, overall: this.state.overallScores.bot2 }
    ];
    return players.sort((a, b) => b.score - a.score);
  }

  // 🔥 NEW: Reset combination area via CardManager
  resetCombination() {
    console.log('🔄 RESETTING COMBINATION AREA VIA CARDMANAGER');
    this.clearComboAreas();
  }

  // 🔥 NEW: Perfect card validation via CardManager
  validateCardCount() {
    return this.cardManager.validateCardCount('GAMEENGINE_VALIDATION');
  }
  
  // 🔥 NEW: Debug functions
  debugCardState() {
    console.log('🔍 GAMEENGINE CARD STATE (via CardManager):');
    this.cardManager.debugCardDistribution();
    return this.cardManager.validateCardCount('DEBUG');
  }
}

// Export for use in other files
window.GameEngine = GameEngine;