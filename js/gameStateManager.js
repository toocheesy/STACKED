/* 
 * 🎯 GAME STATE MANAGER - ULTIMATE GAME FLOW CONTROLLER
 * Single source of truth for all game state decisions
 * Replaces ALL existing checkGameEnd/checkEndCondition functions
 * 🔥 BULLETPROOF DESIGN: No more freezing, no more conflicts!
 */

class GameStateManager {
  constructor() {
    this.maxSafetyAttempts = 3;
    this.debugMode = true; // Set to false to reduce logging
    
    // Game state constants
    this.STATES = {
      CONTINUE_TURN: 'CONTINUE_TURN',
      DEAL_NEW_HAND: 'DEAL_NEW_HAND', 
      END_ROUND: 'END_ROUND',
      END_GAME: 'END_GAME',
      ERROR: 'ERROR'
    };
    
    console.log('🎯 GAME STATE MANAGER INITIALIZED - ULTIMATE FLOW CONTROL READY!');
  }

  // 🎯 MAIN FUNCTION: Determines what should happen next in the game
  determineGameState(gameEngine) {
    this.log('🔍 DETERMINING GAME STATE - ENTRY POINT');
    
    let attempts = 0;
    
    while (attempts < this.maxSafetyAttempts) {
      attempts++;
      this.log(`🔄 ATTEMPT ${attempts}/${this.maxSafetyAttempts}`);
      
      try {
        // Get current game state snapshot
        const snapshot = this.captureGameSnapshot(gameEngine);
        this.logSnapshot(snapshot);
        
        // Validate game state isn't impossible
        const validation = this.validateGameState(snapshot);
        if (!validation.isValid) {
          return this.createErrorResult(`Invalid game state: ${validation.reason}`, snapshot);
        }
        
        // Determine what should happen next
        const result = this.analyzeGameState(snapshot, gameEngine);
        
        this.log(`✅ GAME STATE DETERMINED: ${result.state}`);
        return result;
        
      } catch (error) {
        this.log(`🚨 ERROR IN ATTEMPT ${attempts}: ${error.message}`);
        if (attempts >= this.maxSafetyAttempts) {
          return this.createErrorResult(`Failed after ${this.maxSafetyAttempts} attempts: ${error.message}`);
        }
      }
    }
    
    // Should never reach here, but safety fallback
    return this.createErrorResult('Exceeded maximum safety attempts');
  }

  // 📸 CAPTURE COMPLETE GAME STATE SNAPSHOT
  captureGameSnapshot(gameEngine) {
    const state = gameEngine.getState();
    
    return {
      // Player hands
      handSizes: state.hands.map(hand => hand ? hand.length : 0),
      totalCardsInHands: state.hands.reduce((total, hand) => total + (hand ? hand.length : 0), 0),
      
      // Deck and board
      deckSize: state.deck ? state.deck.length : 0,
      boardSize: state.board ? state.board.length : 0,
      
      // Players and dealer
      currentPlayer: state.currentPlayer,
      currentDealer: gameEngine.currentDealer,
      startingPlayer: (gameEngine.currentDealer + 1) % 3,
      
      // Scores
      currentScores: { ...state.scores },
      overallScores: { ...state.overallScores },
      targetScore: state.settings ? state.settings.targetScore : 500,
      
      // Game metadata
      currentRound: gameEngine.currentRound,
      lastCapturer: state.lastCapturer,
      
      // Raw state reference for actions
      gameEngine: gameEngine
    };
  }

  // 🔍 ANALYZE GAME STATE AND DETERMINE NEXT ACTION
  analyzeGameState(snapshot, gameEngine) {
    this.log('🎯 ANALYZING GAME STATE...');
    
    // 🔥 NEW: Check what the last action was
    const lastAction = gameEngine.state.lastAction || null;
    const currentPlayer = snapshot.currentPlayer;
    
    this.log(`🎯 LAST ACTION: ${lastAction}, CURRENT PLAYER: ${currentPlayer}`);
    
    // 🔥 RULE: If last action was "place", turn MUST end (find next player)
    if (lastAction === 'place') {
      this.log('🎯 LAST ACTION WAS PLACE - TURN MUST END, FINDING NEXT PLAYER');
      
      // Find next player in turn order (not the current player who just placed)
      const nextPlayerWithCards = this.findNextPlayerWithCards(snapshot, true); // true = skip current player
      
      if (nextPlayerWithCards !== null) {
        this.log(`✅ NEXT PLAYER ${nextPlayerWithCards} HAS CARDS - CONTINUE TURN`);
        return this.createContinueTurnResult(nextPlayerWithCards, snapshot);
      }
    } 
    // 🔥 RULE: If last action was "capture", same player can continue if they have cards
    else if (lastAction === 'capture') {
      this.log('🎯 LAST ACTION WAS CAPTURE - SAME PLAYER CAN CONTINUE IF THEY HAVE CARDS');
      
      if (snapshot.handSizes[currentPlayer] > 0) {
        this.log(`✅ PLAYER ${currentPlayer} HAS CARDS AFTER CAPTURE - CONTINUE TURN`);
        return this.createContinueTurnResult(currentPlayer, snapshot);
      } else {
        this.log(`🎯 PLAYER ${currentPlayer} OUT OF CARDS AFTER CAPTURE - FINDING NEXT PLAYER`);
        const nextPlayerWithCards = this.findNextPlayerWithCards(snapshot, true);
        if (nextPlayerWithCards !== null) {
          return this.createContinueTurnResult(nextPlayerWithCards, snapshot);
        }
      }
    }
    // 🔥 FALLBACK: No last action recorded, use original logic
    else {
      this.log('🎯 NO LAST ACTION RECORDED - USING ORIGINAL LOGIC');
      const playerWithCards = this.findNextPlayerWithCards(snapshot);
      if (playerWithCards !== null) {
        this.log(`✅ PLAYER ${playerWithCards} HAS CARDS - CONTINUE TURN`);
        return this.createContinueTurnResult(playerWithCards, snapshot);
      }
    }
    
    // STEP 2: Check if we can deal new hand (DEAL_NEW_HAND)
    if (this.canDealNewHand(snapshot)) {
      this.log(`✅ DECK HAS ${snapshot.deckSize} CARDS - DEAL NEW HAND`);
      return this.createDealNewHandResult(snapshot);
    }
    
    // STEP 3: Round end - apply jackpot and check scores
    this.log('🏆 ROUND END - APPLYING JACKPOT AND CHECKING SCORES');
    const jackpotResult = this.applyJackpot(snapshot, gameEngine);
    const scoresAfterJackpot = this.calculateScoresAfterJackpot(snapshot, jackpotResult);
    
    // STEP 4: Determine if game ends or continues to new round
    const shouldEndGame = this.shouldGameEnd(scoresAfterJackpot, snapshot.targetScore);
    
    if (shouldEndGame) {
      this.log('🏆 GAME SHOULD END - TARGET SCORE REACHED');
      return this.createEndGameResult(scoresAfterJackpot, jackpotResult, snapshot);
    } else {
      this.log('🔄 NEW ROUND NEEDED - NO ONE REACHED TARGET');
      return this.createEndRoundResult(scoresAfterJackpot, jackpotResult, snapshot);
    }
  }

  // 🔍 FIND NEXT PLAYER WITH CARDS (DEALER ORDER)
  findNextPlayerWithCards(snapshot, skipCurrentPlayer = false) {
    this.log('🔍 SEARCHING FOR PLAYER WITH CARDS...');
    
    let playerOrder;
    
    if (skipCurrentPlayer) {
      // 🔥 NEW: Skip current player, start with next player in turn order
      this.log(`🔄 SKIPPING CURRENT PLAYER ${snapshot.currentPlayer}, FINDING NEXT`);
      
      playerOrder = [
        (snapshot.currentPlayer + 1) % 3,
        (snapshot.currentPlayer + 2) % 3,
        snapshot.currentPlayer  // Check current player last as fallback
      ];
    } else {
      // Original logic: Check players in dealer order starting with starting player
      playerOrder = [
        snapshot.startingPlayer,
        (snapshot.startingPlayer + 1) % 3,
        (snapshot.startingPlayer + 2) % 3
      ];
    }
    
    for (const playerIndex of playerOrder) {
      const cardCount = snapshot.handSizes[playerIndex];
      this.log(`   Player ${playerIndex}: ${cardCount} cards`);
      
      if (cardCount > 0) {
        this.log(`✅ FOUND: Player ${playerIndex} has ${cardCount} cards`);
        return playerIndex;
      }
    }
    
    this.log('❌ NO PLAYERS HAVE CARDS');
    return null;
  }

  // 🎴 CHECK IF NEW HAND CAN BE DEALT
  canDealNewHand(snapshot) {
    const minCardsNeeded = 12; // 4 cards per player × 3 players
    const canDeal = snapshot.deckSize >= minCardsNeeded;
    
    this.log(`🎴 DECK CHECK: ${snapshot.deckSize} cards available, need ${minCardsNeeded}, can deal: ${canDeal}`);
    return canDeal;
  }

  // 🏆 APPLY JACKPOT LOGIC
  applyJackpot(snapshot, gameEngine) {
    this.log('🏆 APPLYING JACKPOT LOGIC...');
    
    if (snapshot.lastCapturer !== null && snapshot.boardSize > 0) {
      // Calculate jackpot points
      const jackpotPoints = this.calculateJackpotPoints(snapshot.gameEngine.state.board);
      const playerNames = ['Player', 'Bot 1', 'Bot 2'];
      const winnerName = playerNames[snapshot.lastCapturer];
      
      const jackpotMessage = `🏆 ${winnerName} sweeps ${snapshot.boardSize} remaining cards! +${jackpotPoints} pts`;
      
      this.log(`🏆 JACKPOT: ${jackpotMessage}`);
      
      return {
        hasJackpot: true,
        winner: snapshot.lastCapturer,
        winnerName: winnerName,
        points: jackpotPoints,
        cardsCount: snapshot.boardSize,
        message: jackpotMessage
      };
    } else {
      this.log('🏆 NO JACKPOT: No last capturer or empty board');
      return {
        hasJackpot: false,
        message: null
      };
    }
  }

  // 💰 CALCULATE JACKPOT POINTS
  calculateJackpotPoints(boardCards) {
    const pointsMap = {
      'A': 15, 'K': 10, 'Q': 10, 'J': 10, '10': 10,
      '9': 5, '8': 5, '7': 5, '6': 5, '5': 5, '4': 5, '3': 5, '2': 5
    };
    
    return boardCards.reduce((total, card) => total + (pointsMap[card.value] || 0), 0);
  }

  // 📊 CALCULATE SCORES AFTER JACKPOT
  calculateScoresAfterJackpot(snapshot, jackpotResult) {
    const updatedScores = { ...snapshot.currentScores };
    
    if (jackpotResult.hasJackpot) {
      if (jackpotResult.winner === 0) {
        updatedScores.player += jackpotResult.points;
      } else if (jackpotResult.winner === 1) {
        updatedScores.bot1 += jackpotResult.points;
      } else if (jackpotResult.winner === 2) {
        updatedScores.bot2 += jackpotResult.points;
      }
      
      this.log(`📊 SCORES AFTER JACKPOT: Player: ${updatedScores.player}, Bot1: ${updatedScores.bot1}, Bot2: ${updatedScores.bot2}`);
    }
    
    return updatedScores;
  }

  // 🏁 CHECK IF GAME SHOULD END
  shouldGameEnd(scores, targetScore) {
    const highestScore = Math.max(scores.player, scores.bot1, scores.bot2);
    const shouldEnd = highestScore >= targetScore;
    
    this.log(`🏁 GAME END CHECK: Highest score: ${highestScore}, Target: ${targetScore}, Should end: ${shouldEnd}`);
    return shouldEnd;
  }

  // 🛡️ VALIDATE GAME STATE
  validateGameState(snapshot) {
    // Check for impossible states
    if (snapshot.totalCardsInHands < 0) {
      return { isValid: false, reason: 'Negative cards in hands' };
    }
    
    if (snapshot.deckSize < 0) {
      return { isValid: false, reason: 'Negative deck size' };
    }
    
    if (snapshot.currentPlayer < 0 || snapshot.currentPlayer > 2) {
      return { isValid: false, reason: 'Invalid current player' };
    }
    
    const totalCards = snapshot.totalCardsInHands + snapshot.deckSize + snapshot.boardSize;
    if (totalCards > 52) {
      return { isValid: false, reason: `Too many cards in game: ${totalCards}` };
    }
    
    return { isValid: true };
  }

  // 📝 RESULT CREATORS
  createContinueTurnResult(playerIndex, snapshot) {
    return {
      state: this.STATES.CONTINUE_TURN,
      nextPlayer: playerIndex,
      data: {
        playerIndex: playerIndex,
        handSize: snapshot.handSizes[playerIndex],
        reason: 'Player has cards to play'
      }
    };
  }

  createDealNewHandResult(snapshot) {
    return {
      state: this.STATES.DEAL_NEW_HAND,
      data: {
        deckSize: snapshot.deckSize,
        startingPlayer: snapshot.startingPlayer,
        dealer: snapshot.currentDealer,
        reason: 'All players out of cards, deck has cards for new hand'
      }
    };
  }

  createEndRoundResult(scores, jackpotResult, snapshot) {
    const newDealer = (snapshot.currentDealer + 1) % 3;
    
    return {
      state: this.STATES.END_ROUND,
      data: {
        scores: scores,
        jackpot: jackpotResult,
        oldDealer: snapshot.currentDealer,
        newDealer: newDealer,
        newRound: snapshot.currentRound + 1,
        reason: 'Round complete, starting new round'
      }
    };
  }

  createEndGameResult(scores, jackpotResult, snapshot) {
    // Find winner (highest score)
    const winner = scores.player >= scores.bot1 && scores.player >= scores.bot2 ? 0 :
                   scores.bot1 >= scores.bot2 ? 1 : 2;
    
    const playerNames = ['Player', 'Bot 1', 'Bot 2'];
    
    return {
      state: this.STATES.END_GAME,
      data: {
        scores: scores,
        jackpot: jackpotResult,
        winner: winner,
        winnerName: playerNames[winner],
        winnerScore: [scores.player, scores.bot1, scores.bot2][winner],
        targetScore: snapshot.targetScore,
        reason: 'Target score reached, game complete'
      }
    };
  }

  createErrorResult(errorMessage, snapshot = null) {
    return {
      state: this.STATES.ERROR,
      error: true,
      data: {
        message: errorMessage,
        technicalDetails: snapshot ? JSON.stringify(snapshot, null, 2) : 'No snapshot available',
        userMessage: 'Something went wrong with the game flow. Please restart the game.',
        reason: 'Game state error detected'
      }
    };
  }

  // 📝 LOGGING FUNCTIONS
  log(message) {
    if (this.debugMode) {
      console.log(`🎯 GSM: ${message}`);
    }
  }

  logSnapshot(snapshot) {
    if (this.debugMode) {
      this.log('📸 GAME SNAPSHOT:');
      this.log(`   Hands: [${snapshot.handSizes.join(', ')}] (Total: ${snapshot.totalCardsInHands})`);
      this.log(`   Deck: ${snapshot.deckSize} cards`);
      this.log(`   Board: ${snapshot.boardSize} cards`);
      this.log(`   Current Player: ${snapshot.currentPlayer}`);
      this.log(`   Dealer: ${snapshot.currentDealer}, Starting Player: ${snapshot.startingPlayer}`);
      this.log(`   Scores: P:${snapshot.currentScores.player} B1:${snapshot.currentScores.bot1} B2:${snapshot.currentScores.bot2}`);
      this.log(`   Round: ${snapshot.currentRound}, Target: ${snapshot.targetScore}`);
      this.log(`   Last Capturer: ${snapshot.lastCapturer}`);
    }
  }

  // 🎯 PUBLIC API FOR EXTERNAL USE
  getAvailableStates() {
    return { ...this.STATES };
  }

  setDebugMode(enabled) {
    this.debugMode = enabled;
    this.log(`Debug mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  setSafetyAttempts(attempts) {
    this.maxSafetyAttempts = Math.max(1, Math.min(10, attempts));
    this.log(`Safety attempts set to ${this.maxSafetyAttempts}`);
  }
}

// 🌍 GLOBAL INSTANCE
window.gameStateManager = new GameStateManager();

// Export for use in other files
window.GameStateManager = GameStateManager;