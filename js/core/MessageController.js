/* 
 * 🎯 COMBO ASSISTANT MESSAGE CONTROLLER
 * Guides beginners through combo building step-by-step!
 */

class MessageController {
  constructor() {
    this.messageElement = document.getElementById('smart-message');
    this.regularMessageElement = document.getElementById('message');
    this.currentTimeout = null;
    this.gameEngine = null;
    this.educationalMode = false;
    this.lastBotAction = null;
    this.comboGuidanceActive = false; // Track if we're actively guiding a combo
    
    console.log('🎯 COMBO ASSISTANT MESSAGE CONTROLLER INITIALIZED - READY TO TEACH!');
  }

  // 🔥 CONNECT TO GAME ENGINE
  connect(gameEngine) {
    this.gameEngine = gameEngine;
    
    // 🎓 AUTO-ENABLE EDUCATIONAL MODE FOR BEGINNER DIFFICULTY
    if (gameEngine.state.settings.botDifficulty === 'beginner') {
      this.educationalMode = true;
      console.log('🎓 EDUCATIONAL MODE ACTIVATED - COMBO ASSISTANT READY!');
    }
    
    console.log('🎯 MESSAGE CONTROLLER CONNECTED TO GAME ENGINE!');
  }

  // 🎯 MAIN EVENT HANDLER - WITH COMBO ASSISTANCE
  handleGameEvent(eventType, data = {}) {
    console.log(`🎯 MESSAGE EVENT: ${eventType}`, data);
    
    // Clear any existing timeout
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    // Route to appropriate message handler
    switch(eventType) {
      case 'TURN_START':
        this.handleTurnStart(data);
        break;
      case 'CARDS_IN_COMBO':
        this.handleCardsInCombo(data);
        break;
      case 'CARD_ADDED_TO_COMBO': // 🎓 NEW: Individual card assistance
        this.handleCardAddedToCombo(data);
        break;
      case 'COMBO_ANALYSIS': // 🎓 NEW: Real-time combo analysis
        this.handleComboAnalysis(data);
        break;
      case 'VALID_COMBO':
        this.handleValidCombo(data);
        break;
      case 'CAPTURE_SUCCESS':
        this.handleCaptureSuccess(data);
        break;
      case 'CAPTURE_ERROR':
        this.handleCaptureError(data);
        break;
      case 'CARD_PLACED':
        this.handleCardPlaced(data);
        break;
      case 'GAME_OVER':
        this.handleGameOver(data);
        break;
      case 'ROUND_END':
        this.handleRoundEnd(data);
        break;
      case 'BOT_THINKING':
        this.handleBotThinking(data);
        break;
      case 'BOT_CAPTURE_EDUCATIONAL':
        this.handleBotCaptureEducational(data);
        break;
      case 'BOT_PLACEMENT_EDUCATIONAL':
        this.handleBotPlacementEducational(data);
        break;
      case 'PLAYER_OUT_OF_CARDS':
        this.handlePlayerOutOfCards(data);
        break;
      case 'NEW_ROUND':
        this.handleNewRound(data);
        break;
      case 'HINT_REQUESTED':
        this.handleHintRequested(data);
        break;
      case 'RESET_COMBO':
        this.handleResetCombo(data);
        break;
      default:
        console.warn(`🚨 Unknown message event: ${eventType}`);
        this.showDefaultMessage();
    }
  }

  // 🎯 ENHANCED TURN START - WITH SPECIFIC GUIDANCE
  handleTurnStart(data) {
    const currentPlayer = this.getCurrentPlayer();
    const difficulty = this.getBotDifficulty();
    
    if (currentPlayer === 0) {
      const handSize = this.getHandSize(0);
      if (handSize === 0) {
        this.showMessage("You're out of cards! Watch the bots finish and learn from their strategies", 'info');
      } else if (this.educationalMode) {
        // 🎓 ANALYZE PLAYER'S HAND AND GIVE SPECIFIC GUIDANCE
        const guidance = this.analyzePlayerHand();
        this.showMessage(guidance, 'normal');
      } else {
        this.showMessage("Your turn! Drag cards to build captures or place one on board to end turn", 'normal');
      }
    } else if (currentPlayer === 1) {
      if (difficulty === 'beginner' || this.educationalMode) {
        this.showMessage("🤖📚 Bot 1 is learning... looking for simple matches and safe moves!", 'bot-turn');
      } else if (difficulty === 'legendary') {
        this.showMessage("🧠⚡ Bot 1 (Legendary) is calculating advanced strategies...", 'bot-turn');
      } else {
        this.showMessage("🤖 Bot 1's turn...", 'bot-turn');
      }
    } else if (currentPlayer === 2) {
      if (difficulty === 'beginner' || this.educationalMode) {
        this.showMessage("🤖📚 Bot 2 is practicing... thinking about which cards are safest to play!", 'bot-turn');
      } else if (difficulty === 'legendary') {
        this.showMessage("🧠⚡ Bot 2 (Legendary) is analyzing the perfect move...", 'bot-turn');
      } else {
        this.showMessage("🤖 Bot 2's turn...", 'bot-turn');
      }
    }
  }

  // 🎓 NEW: ANALYZE PLAYER'S HAND FOR SPECIFIC GUIDANCE
  analyzePlayerHand() {
    const hand = this.gameEngine.state.hands[0] || [];
    const board = this.gameEngine.state.board || [];
    
    if (hand.length === 0 || board.length === 0) {
      return "🎓 Your turn! Drag cards to build combos or place one on board to end turn";
    }

    // Look for obvious pairs
    const pairOpportunities = this.findPairOpportunities(hand, board);
    if (pairOpportunities.length > 0) {
      const example = pairOpportunities[0];
      return `🎓 Great! You have ${example.handCard} in hand and ${example.boardCard} on board - that's a PAIR! Try it!`;
    }

    // Look for simple sums
    const sumOpportunities = this.findSimpleSumOpportunities(hand, board);
    if (sumOpportunities.length > 0) {
      const example = sumOpportunities[0];
      return `🎓 Nice! Try this SUM: ${example.handCard} + ${example.boardCard} = ${example.target}. Look for the ${example.target} on board!`;
    }

    // Look for face cards to protect
    const faceCards = hand.filter(card => ['J', 'Q', 'K'].includes(card.value));
    if (faceCards.length > 0) {
      return `🎓 You have valuable face cards (${faceCards.map(c => c.value).join(', ')})! Look for matching pairs, or save them for later.`;
    }

    // Default guidance
    return "🎓 Your turn! Look for pairs (same values) or sums (numbers that add up). Drag cards to combo areas to try!";
  }

  // 🎓 FIND PAIR OPPORTUNITIES
  findPairOpportunities(hand, board) {
    const opportunities = [];
    
    hand.forEach(handCard => {
      board.forEach(boardCard => {
        if (handCard.value === boardCard.value) {
          opportunities.push({
            handCard: `${handCard.value}${this.getSuitSymbol(handCard.suit)}`,
            boardCard: `${boardCard.value}${this.getSuitSymbol(boardCard.suit)}`,
            type: 'pair'
          });
        }
      });
    });
    
    return opportunities;
  }

  // 🎓 FIND SIMPLE SUM OPPORTUNITIES
  findSimpleSumOpportunities(hand, board) {
    const opportunities = [];
    
    hand.forEach(handCard => {
      const handValue = this.getCardNumericValue(handCard);
      if (handValue === null || handValue > 10) return; // Skip face cards
      
      board.forEach(boardCard => {
        const boardValue = this.getCardNumericValue(boardCard);
        if (boardValue === null || boardValue > 10) return; // Skip face cards
        
        const sum = handValue + boardValue;
        if (sum <= 10) {
          // Check if target exists on board
          const targetExists = board.some(card => this.getCardNumericValue(card) === sum);
          if (targetExists) {
            opportunities.push({
              handCard: `${handCard.value}${this.getSuitSymbol(handCard.suit)}`,
              boardCard: `${boardCard.value}${this.getSuitSymbol(boardCard.suit)}`,
              target: sum,
              type: 'sum'
            });
          }
        }
      });
    });
    
    return opportunities;
  }

  // 🎓 NEW: HANDLE INDIVIDUAL CARD ADDED TO COMBO
  handleCardAddedToCombo(data) {
    if (!this.educationalMode) return;
    
    const slot = data.slot || '';
    const cardName = data.cardName || 'card';
    const source = data.source || '';
    
    this.comboGuidanceActive = true;
    
    if (slot === 'base') {
      this.showMessage(`🎓 Great start! ${cardName} is now your BASE card. Now find matching cards or numbers that add up to ${this.getCardNumericValue(data.card) || 'it'}!`, 'combo-guidance');
    } else if (slot.includes('sum')) {
      this.showMessage(`🎓 Good! Added ${cardName} to sum area. Keep adding cards that add up to your base card!`, 'combo-guidance');
    } else if (slot === 'match') {
      this.showMessage(`🎓 Perfect! Added ${cardName} to match area. Look for more cards with the same value!`, 'combo-guidance');
    }
    
    // Auto-analyze the current combo state after a short delay
    this.currentTimeout = setTimeout(() => {
      this.analyzeCurrentCombo();
    }, 1500);
  }

  // 🎓 NEW: REAL-TIME COMBO ANALYSIS
  analyzeCurrentCombo() {
    if (!this.educationalMode || !this.comboGuidanceActive) return;
    
    const combo = this.gameEngine.state.combination;
    const hasBase = combo.base.length > 0;
    const hasCaptureCards = combo.sum1.length + combo.sum2.length + combo.sum3.length + combo.match.length > 0;
    
    if (hasBase && hasCaptureCards) {
      // Try to validate and give specific feedback
      const baseCard = combo.base[0];
      const baseValue = this.getCardNumericValue(baseCard.card);
      
      // Check what type of combo they're building
      if (combo.match.length > 0) {
        const allMatch = combo.match.every(entry => entry.card.value === baseCard.card.value);
        if (allMatch) {
          this.showMessage(`🎓 Excellent PAIR combo! All ${baseCard.card.value}s match. Click 'Submit Move' to capture!`, 'combo-success');
        } else {
          this.showMessage(`🎓 Hmm, not all cards match ${baseCard.card.value}. For pairs, all cards need the same value!`, 'combo-guidance');
        }
      } else if (combo.sum1.length > 0 || combo.sum2.length > 0 || combo.sum3.length > 0) {
        if (baseValue && baseValue <= 10) {
          this.showMessage(`🎓 Building a SUM combo! Make sure your sum cards add up to ${baseValue}. Try the math!`, 'combo-guidance');
        } else {
          this.showMessage(`🎓 Face cards (J, Q, K) can only make pairs, not sums. Try the match area instead!`, 'combo-guidance');
        }
      }
    } else if (hasBase && !hasCaptureCards) {
      const baseCard = combo.base[0];
      const suggestions = this.suggestNextCards(baseCard.card);
      this.showMessage(suggestions, 'combo-guidance');
    }
  }

  // 🎓 SUGGEST NEXT CARDS FOR COMBO
  suggestNextCards(baseCard) {
    const baseValue = this.getCardNumericValue(baseCard);
    const board = this.gameEngine.state.board || [];
    const hand = this.gameEngine.state.hands[0] || [];
    
    // Look for matching cards
    const matchingCards = [...board, ...hand].filter(card => 
      card.value === baseCard.value && card.id !== baseCard.id
    );
    
    if (matchingCards.length > 0) {
      const examples = matchingCards.slice(0, 2).map(card => 
        `${card.value}${this.getSuitSymbol(card.suit)}`
      ).join(' or ');
      return `🎓 Your base is ${baseCard.value}${this.getSuitSymbol(baseCard.suit)}. Look for ${examples} to make a pair!`;
    }
    
    // Look for sum opportunities if it's a number card
    if (baseValue && baseValue <= 10) {
      const possibleSums = [];
      board.forEach(boardCard => {
        hand.forEach(handCard => {
          const boardValue = this.getCardNumericValue(boardCard);
          const handValue = this.getCardNumericValue(handCard);
          if (boardValue && handValue && boardValue + handValue === baseValue) {
            possibleSums.push(`${handCard.value}+${boardCard.value}`);
          }
        });
      });
      
      if (possibleSums.length > 0) {
        return `🎓 Your base is ${baseValue}. Try sum: ${possibleSums[0]} = ${baseValue}!`;
      }
    }
    
    return `🎓 Your base is ${baseCard.value}${this.getSuitSymbol(baseCard.suit)}. Look for matching ${baseCard.value}s or numbers that add up to ${baseValue || 'it'}!`;
  }

  // 🎯 ENHANCED CARDS IN COMBO - WITH REAL-TIME GUIDANCE
  handleCardsInCombo(data) {
    const currentPlayer = this.getCurrentPlayer();
    
    if (currentPlayer === 0) {
      if (this.educationalMode) {
        this.comboGuidanceActive = true;
        // Don't override specific combo guidance if it's active
        if (!this.currentTimeout) {
          this.analyzeCurrentCombo();
        }
      } else {
        this.showMessage("Build your combo and click 'Submit Move' or reset to try again", 'normal');
      }
    } else {
      this.showMessage(`🤖 Bot ${currentPlayer} is building a combo...`, 'bot-turn');
    }
  }

  // 🎯 ENHANCED VALID COMBO - CELEBRATE SUCCESS
  handleValidCombo(data) {
    const currentPlayer = this.getCurrentPlayer();
    
    if (currentPlayer === 0) {
      this.comboGuidanceActive = false;
      if (this.educationalMode) {
        const combo = this.gameEngine.state.combination;
        const comboType = this.identifyComboType(combo);
        this.showMessage(`🎉 PERFECT ${comboType} COMBO! You've mastered it! Click 'Submit Move' to score big!`, 'combo-success');
      } else {
        this.showMessage("✅ Valid combo! Click 'Submit Move' to capture these cards", 'success');
      }
    } else {
      this.showMessage(`🤖 Bot ${currentPlayer} found a valid combo!`, 'bot-turn');
    }
  }

  // 🎓 IDENTIFY COMBO TYPE FOR CELEBRATION
  identifyComboType(combo) {
    if (combo.match.length > 0) {
      return combo.match.length === 1 ? 'PAIR' : 'MULTI-PAIR';
    } else if (combo.sum1.length > 0 || combo.sum2.length > 0 || combo.sum3.length > 0) {
      const totalSumCards = combo.sum1.length + combo.sum2.length + combo.sum3.length;
      return totalSumCards === 1 ? 'SUM' : 'MULTI-SUM';
    }
    return 'COMBO';
  }

  // 🎯 ENHANCED CAPTURE ERROR - SPECIFIC ASSISTANCE
  handleCaptureError(data) {
    const errorMessage = data.message || 'Invalid capture attempt';
    this.comboGuidanceActive = false;
    
    if (this.educationalMode) {
      let educationalError = this.translateErrorToGuidance(errorMessage);
      this.showMessage(`❌ ${educationalError}`, 'error');
    } else {
      this.showMessage(`❌ ${errorMessage}`, 'error');
    }
    
    this.currentTimeout = setTimeout(() => {
      this.handleGameEvent('TURN_START');
    }, this.educationalMode ? 6000 : 4000);
  }

  // 🎓 TRANSLATE ERRORS TO HELPFUL GUIDANCE
  translateErrorToGuidance(errorMessage) {
    if (errorMessage.includes('Base Card area')) {
      return "Put exactly ONE card in the Base Card area (top slot) first! That's your target card.";
    }
    
    if (errorMessage.includes('hand + board')) {
      return "Your combo needs cards from BOTH your hand AND the board! Mix them together in the capture areas.";
    }
    
    if (errorMessage.includes("don't match")) {
      return "For pairs: all cards must have the same value (like K♠ + K♥). Check your base card value!";
    }
    
    if (errorMessage.includes('Face cards')) {
      return "Kings, Queens, Jacks can only make pairs, not sums. Use the Match area for face cards!";
    }
    
    if (errorMessage.includes('sum')) {
      const combo = this.gameEngine.state.combination;
      if (combo.base.length > 0) {
        const baseValue = this.getCardNumericValue(combo.base[0].card);
        return `For sums: your cards must add up to ${baseValue}. Check your math: do they equal ${baseValue}?`;
      }
      return "For sums: make sure your cards add up to your base card's value. Try the math!";
    }
    
    return "Something's not quite right with your combo. Try again - you've got this!";
  }

  // 🎯 ENHANCED HINT - SPECIFIC COMBO SUGGESTIONS
  handleHintRequested(data) {
    const hintText = data.hintText || 'Try combining the highlighted cards!';
    
    if (this.educationalMode) {
      const specificHint = this.generateSpecificHint();
      this.showMessage(`💡 ${specificHint}`, 'hint');
    } else {
      this.showMessage(`💡 Hint: ${hintText}`, 'hint');
    }
    
    this.currentTimeout = setTimeout(() => {
      this.handleGameEvent('TURN_START');
    }, this.educationalMode ? 8000 : 5000);
  }

  // 🎓 GENERATE SPECIFIC HINTS BASED ON GAME STATE
  generateSpecificHint() {
    const hand = this.gameEngine.state.hands[0] || [];
    const board = this.gameEngine.state.board || [];
    
    // Look for the easiest captures first
    const pairOpportunities = this.findPairOpportunities(hand, board);
    if (pairOpportunities.length > 0) {
      const best = pairOpportunities[0];
      return `Easy pair available! You have ${best.handCard} and there's ${best.boardCard} on the board. Put ${best.handCard} in Base, then both cards in Match area!`;
    }
    
    const sumOpportunities = this.findSimpleSumOpportunities(hand, board);
    if (sumOpportunities.length > 0) {
      const best = sumOpportunities[0];
      return `Sum combo available! ${best.handCard} + ${best.boardCard} = ${best.target}. Put the ${best.target} in Base, others in Sum area!`;
    }
    
    // No captures available
    const lowCards = hand.filter(card => {
      const value = this.getCardNumericValue(card);
      return value && value <= 4;
    });
    
    if (lowCards.length > 0) {
      return `No captures right now. Place your ${lowCards[0].value}${this.getSuitSymbol(lowCards[0].suit)} on the board - low cards are usually safest!`;
    }
    
    return "No captures available. Place your lowest value card on the board to end your turn safely!";
  }

  // 🎯 UTILITY FUNCTIONS
  getCardNumericValue(card) {
    if (!card) return null;
    if (card.value === 'A') return 1;
    const num = parseInt(card.value);
    return isNaN(num) ? null : num;
  }

  getSuitSymbol(suit) {
    const symbols = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
    return symbols[suit] || '';
  }

  getBotDifficulty() {
    if (!this.gameEngine || !this.gameEngine.state || !this.gameEngine.state.settings) {
      return 'intermediate';
    }
    return this.gameEngine.state.settings.botDifficulty;
  }

  getCurrentPlayer() {
    if (!this.gameEngine || !this.gameEngine.state) {
      return 0;
    }
    return this.gameEngine.state.currentPlayer;
  }

  getHandSize(playerIndex) {
    if (!this.gameEngine || !this.gameEngine.state || !this.gameEngine.state.hands) {
      return 0;
    }
    const hands = this.gameEngine.state.hands;
    return hands[playerIndex] ? hands[playerIndex].length : 0;
  }

  // 🎯 CORE MESSAGE DISPLAY
  showMessage(text, type = 'normal') {
    console.log(`🎯 SHOWING MESSAGE: "${text}" (${type})`);
    
    if (this.messageElement) {
      this.messageElement.textContent = text;
      this.messageElement.className = `smart-message ${type}`;
    }
    
    if (this.regularMessageElement) {
      this.regularMessageElement.style.display = 'none';
    }
    
    this.playMessageSound(type);
  }

  playMessageSound(type) {
    if (typeof playSound === 'function') {
      switch(type) {
        case 'success':
        case 'combo-success':
          playSound('capture');
          break;
        case 'error':
          playSound('invalid');
          break;
        case 'game-over':
          playSound('winner');
          break;
      }
    }
  }

  // 🎯 KEEP ALL OTHER EXISTING FUNCTIONS
  handleCaptureSuccess(data) {
    const currentPlayer = this.getCurrentPlayer();
    const points = data.points || 0;
    const cardsCount = data.cardsCount || 0;
    
    this.comboGuidanceActive = false;
    
    if (currentPlayer === 0) {
      if (this.educationalMode) {
        this.showMessage(`🎉 AMAZING! You scored ${points} points with ${cardsCount} cards! Keep building combos like that!`, 'success');
      } else {
        this.showMessage(`🎉 Capture successful! +${points} points (${cardsCount} cards)`, 'success');
      }
    } else {
      this.showMessage(`🤖 Bot ${currentPlayer} captured ${cardsCount} cards for ${points} points!`, 'bot-turn');
    }
    
    this.currentTimeout = setTimeout(() => {
      this.handleGameEvent('TURN_START');
    }, this.educationalMode ? 4000 : 3000);
  }

  handleResetCombo(data) {
    this.comboGuidanceActive = false;
    
    if (this.educationalMode) {
      this.showMessage("🎓 No problem! Try a different combination. Experimenting is the best way to learn!", 'info');
    } else {
      this.showMessage("Combo reset! Cards returned to original positions", 'info');
    }
    
    this.currentTimeout = setTimeout(() => {
      this.handleGameEvent('TURN_START');
    }, this.educationalMode ? 3000 : 2000);
  }

  // Keep all other existing functions unchanged...
  handleCardPlaced(data) {
    const currentPlayer = this.getCurrentPlayer();
    const cardName = data.cardName || 'card';
    
    if (currentPlayer === 0) {
      if (this.educationalMode) {
        this.showMessage(`🎓 Smart move! You placed ${cardName} on the board. Turn ending...`, 'normal');
      } else {
        this.showMessage(`Card placed on board. Turn ending...`, 'normal');
      }
    } else {
      this.showMessage(`🤖 Bot ${currentPlayer} placed ${cardName} on board`, 'bot-turn');
    }
  }

  handleGameOver(data) {
    const winner = data.winner || 'Unknown';
    if (this.educationalMode) {
      this.showMessage(`🏆 Game Over! ${winner} wins! You learned so much - play again to master more strategies!`, 'game-over');
    } else {
      this.showMessage(`🏆 Game Over! ${winner} wins!`, 'game-over');
    }
  }

  handleRoundEnd(data) {
    if (this.educationalMode) {
      this.showMessage("🎓 Round complete! Watch how bots play their new cards - great learning opportunity!", 'info');
    } else {
      this.showMessage("Round complete! Dealing new cards...", 'info');
    }
  }

  // 🔥 REPLACE THE handleBotThinking() FUNCTION IN MessageController.js WITH THIS FASTER VERSION:

handleBotThinking(data) {
  const botNumber = data.botNumber || this.getCurrentPlayer();
  const difficulty = this.getBotDifficulty();
  
  // 🔥 CRITICAL FIX: MUCH SHORTER TIMEOUT FOR BOT MESSAGES
  if (this.currentTimeout) {
    clearTimeout(this.currentTimeout);
    this.currentTimeout = null;
  }
  
  if (difficulty === 'beginner' || this.educationalMode) {
    const thinkingMessages = [
      `🤖📚 Bot ${botNumber} is checking for simple pairs...`,
      `🤖📚 Bot ${botNumber} is doing the math for sums...`,
      `🤖📚 Bot ${botNumber} is being careful with valuable cards...`
    ];
    const randomMessage = thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)];
    this.showMessage(randomMessage, 'bot-turn');
    
    // 🔥 MUCH SHORTER TIMEOUT - UPDATE FASTER
    this.currentTimeout = setTimeout(() => {
      this.forceRefresh();
    }, 500); // Only 500ms instead of longer delays
    
  } else if (difficulty === 'legendary') {
    this.showMessage(`🧠⚡ Bot ${botNumber} (Legendary) is calculating optimal strategy...`, 'bot-turn');
    
    // 🔥 SHORTER TIMEOUT FOR LEGENDARY TOO
    this.currentTimeout = setTimeout(() => {
      this.forceRefresh();
    }, 800);
    
  } else {
    this.showMessage(`🤖 Bot ${botNumber} is thinking...`, 'bot-turn');
    
    // 🔥 SHORTER TIMEOUT FOR INTERMEDIATE
    this.currentTimeout = setTimeout(() => {
      this.forceRefresh();
    }, 600);
  }
}

  handlePlayerOutOfCards(data) {
    if (this.educationalMode) {
      this.showMessage("🎓 You're out of cards! Perfect time to watch and learn from the bots' strategies!", 'info');
    } else {
      this.showMessage("You're out of cards! Bots will finish the round.", 'info');
    }
  }

  handleNewRound(data) {
    const roundNumber = data.roundNumber || '?';
    if (this.educationalMode) {
      this.showMessage(`🎓 Round ${roundNumber}! Remember: pairs (same values) and sums (adding up). You're getting better!`, 'info');
    } else {
      this.showMessage(`Round ${roundNumber} starting!`, 'info');
    }
    
    this.currentTimeout = setTimeout(() => {
      this.handleGameEvent('TURN_START');
    }, this.educationalMode ? 3000 : 2000);
  }

  handleBotCaptureEducational(data) {
    const currentPlayer = this.getCurrentPlayer();
    const captureType = data.captureType || 'unknown';
    const points = data.points || 0;
    const explanation = data.explanation || '';
    
    let message = '';
    
    if (captureType === 'pair') {
      message = `🎓 Bot ${currentPlayer} found a PAIR! ${explanation} (+${points} pts) - See how they matched same values?`;
    } else if (captureType === 'sum') {
      message = `🎓 Bot ${currentPlayer} made a SUM! ${explanation} (+${points} pts) - Notice the math: they added up to the target!`;
    } else {
      message = `🎓 Bot ${currentPlayer} captured ${data.cardsCount || 0} cards! ${explanation} (+${points} pts)`;
    }
    
    this.showMessage(message, 'bot-educational');
    
    this.currentTimeout = setTimeout(() => {
      this.handleGameEvent('TURN_START');
    }, 5000);
  }

  handleBotPlacementEducational(data) {
    const currentPlayer = this.getCurrentPlayer();
    const cardName = data.cardName || 'card';
    const reason = data.reason || '';
    
    let message = `🎓 Bot ${currentPlayer} placed ${cardName}`;
    if (reason) {
      message += ` - ${reason}`;
    }
    
    this.showMessage(message, 'bot-educational');
    
    this.currentTimeout = setTimeout(() => {
      this.handleGameEvent('TURN_START');
    }, 3500);
  }

  showDefaultMessage() {
    const currentPlayer = this.getCurrentPlayer();
    
    if (currentPlayer === 0) {
      if (this.educationalMode) {
        this.showMessage("🎓 Your turn! Look for pairs (same values) or sums (numbers that add up). You've got this!", 'normal');
      } else {
        this.showMessage("Your turn! Drag cards to build captures or place one on board to end turn", 'normal');
      }
    } else {
      this.showMessage(`🤖 Bot ${currentPlayer}'s turn...`, 'bot-turn');
    }
  }

  forceRefresh() {
    console.log('🎯 FORCE REFRESH MESSAGE');
    this.comboGuidanceActive = false;
    this.handleGameEvent('TURN_START');
  }

  toggleEducationalMode() {
    this.educationalMode = !this.educationalMode;
    console.log(`🎓 Educational Mode: ${this.educationalMode ? 'ON' : 'OFF'}`);
    this.forceRefresh();
  }

  debugState() {
    console.log('🎯 COMBO ASSISTANT DEBUG:');
    console.log('  Current Player:', this.getCurrentPlayer());
    console.log('  Bot Difficulty:', this.getBotDifficulty());
    console.log('  Educational Mode:', this.educationalMode);
    console.log('  Combo Guidance Active:', this.comboGuidanceActive);
    console.log('  Hand Sizes:', [this.getHandSize(0), this.getHandSize(1), this.getHandSize(2)]);
  }
}

// 🎯 GLOBAL MESSAGE CONTROLLER INSTANCE
window.messageController = new MessageController();

// Export for other files
window.MessageController = MessageController;