/* 
 * GameEngine - Core Game Logic for STACKED!
 * Handles game state, validation, and mode coordination
 * Works with any game mode
 */

class GameEngine {
  constructor() {
    this.state = {
      deck: [],
      board: [],
      hands: [[], [], []], // Player, Bot 1, Bot 2
      scores: { player: 0, bot1: 0, bot2: 0 },
      combination: { base: [], sum1: [], sum2: [], sum3: [], match: [] },
      currentPlayer: 0,
      settings: {
        cardSpeed: 'fast',
        soundEffects: 'off',
        targetScore: 500,
        botDifficulty: 'intermediate'
      },
      draggedCard: null,
      selectedCard: null,
      lastCapturer: null
    };
    
    this.currentMode = null;
    this.currentRound = 1;
    this.currentDealer = 0;
    this.botTurnInProgress = false;
  }

  // Initialize game with specified mode
  initGame(gameMode, settings = {}) {
    console.log(`🎮 Initializing ${gameMode.name}`);
    
    // Set current mode
    this.currentMode = gameMode;
    
    // Apply mode settings
    Object.assign(this.state.settings, settings);
    
    // Create and deal deck
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

    // Initialize game state
    this.state.deck = dealResult.remainingDeck || deck;
    this.state.board = dealResult.board || [];
    this.state.hands = dealResult.players && dealResult.players.length === 3 ? dealResult.players : [[], [], []];
    this.state.hands = this.state.hands.map(hand => {
      if (hand.length === 0 && this.state.deck.length >= 4) {
        return this.state.deck.splice(0, 4);
      }
      return hand;
    });
    
    // Reset scores and round
    this.state.scores = { player: 0, bot1: 0, bot2: 0 };
    this.state.currentPlayer = 0;
    this.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
    this.state.draggedCard = null;
    this.state.selectedCard = null;
    this.currentRound = 1;
    this.currentDealer = Math.floor(Math.random() * 3);
    
    // Initialize mode
    if (this.currentMode.init) {
      this.currentMode.init(this);
    }
    
    console.log(`🎮 ${gameMode.name} initialized successfully`);
  }

  // Get current game state (read-only)
  getState() {
    return { ...this.state };
  }

  // Validate capture using current mode or standard rules
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

  // Standard validation logic (used by all modes unless overridden)
  standardValidateCapture(areaCards, baseValue, baseCard, areaName) {
    const hasHandCard = areaCards.some(entry => entry.source === 'hand') || baseCard.source === 'hand';
    const hasBoardCard = areaCards.some(entry => entry.source === 'board') || baseCard.source === 'board';
    
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

  // Execute capture and update scores
  executeCapture(baseCard, validCaptures, allCapturedCards) {
    console.log(`🎯 EXECUTING CAPTURE - Base: ${baseCard.card.value}${baseCard.card.suit}`);
    
    const cardsToRemove = {
      board: [],
      hand: []
    };
    
    // Collect base card
    if (baseCard.source === 'board') {
      cardsToRemove.board.push(baseCard.card.id);
    } else if (baseCard.source === 'hand') {
      cardsToRemove.hand.push(baseCard.card.id);
    }
    
    // Collect all capture area cards
    validCaptures.forEach(capture => {
      capture.cards.forEach(entry => {
        if (entry.source === 'board') {
          cardsToRemove.board.push(entry.card.id);
        } else if (entry.source === 'hand') {
          cardsToRemove.hand.push(entry.card.id);
        }
      });
    });

    // Remove cards from board
    this.state.board = this.state.board.filter(card => !cardsToRemove.board.includes(card.id));

    // Remove cards from current player's hand
    const currentPlayer = this.state.currentPlayer;
    if (currentPlayer === 0) {
      this.state.hands[0] = this.state.hands[0].filter(card => card && !cardsToRemove.hand.includes(card.id));
    } else {
      this.state.hands[currentPlayer] = this.state.hands[currentPlayer].filter(card => card && !cardsToRemove.hand.includes(card.id));
    }

    // Calculate and apply score
    const points = this.calculateScore(allCapturedCards);
    this.addScore(currentPlayer, points);
    this.state.lastCapturer = currentPlayer;

    console.log(`✅ CAPTURE COMPLETE: ${allCapturedCards.length} cards, ${points} points`);
  }

  // Calculate score using current mode
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

  // Add score to player
  addScore(playerIndex, points) {
    if (playerIndex === 0) {
      this.state.scores.player += points;
      console.log(`🎯 PLAYER SCORED: +${points} pts (Total: ${this.state.scores.player})`);
    } else if (playerIndex === 1) {
      this.state.scores.bot1 += points;
      console.log(`🎯 BOT 1 SCORED: +${points} pts (Total: ${this.state.scores.bot1})`);
    } else if (playerIndex === 2) {
      this.state.scores.bot2 += points;
      console.log(`🎯 BOT 2 SCORED: +${points} pts (Total: ${this.state.scores.bot2})`);
    }
  }

  // Advance to next player
  nextPlayer() {
    this.state.currentPlayer = (this.state.currentPlayer + 1) % 3;
    console.log(`🔄 NEXT PLAYER: ${this.state.currentPlayer}`);
  }

  // Check if game should end (uses current mode)
  checkGameEnd() {
    if (this.currentMode.checkEndCondition) {
      return this.currentMode.checkEndCondition(this);
    }
    
    // Default end condition
    const playersWithCards = this.state.hands.filter(hand => hand.length > 0).length;
    
    if (playersWithCards === 0) {
      const maxScore = Math.max(this.state.scores.player, this.state.scores.bot1, this.state.scores.bot2);
      if (maxScore >= this.state.settings.targetScore) {
        return { gameOver: true, reason: 'target_score_reached' };
      } else {
        return { roundOver: true, gameOver: false, reason: 'round_complete' };
      }
    }
    
    return { continue: true };
  }

  // Get ranked players
  getRankedPlayers() {
    const players = [
      { name: 'Player', score: this.state.scores.player, index: 0 },
      { name: 'Bot 1', score: this.state.scores.bot1, index: 1 },
      { name: 'Bot 2', score: this.state.scores.bot2, index: 2 }
    ];
    return players.sort((a, b) => b.score - a.score);
  }

  // Reset combination area
  resetCombination() {
    this.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
  }
}

// Export for use in other files
window.GameEngine = GameEngine;