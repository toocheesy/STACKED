/* 
 * 🎯 CENTRALIZED MESSAGE CONTROLLER - BULLETPROOF MESSAGING SYSTEM
 * Single source of truth for ALL game messages
 * NO MORE SYNC ISSUES EVER!
 */

class MessageController {
  constructor() {
    this.messageElement = document.getElementById('smart-message');
    this.regularMessageElement = document.getElementById('message');
    this.currentTimeout = null;
    this.gameEngine = null;
    
    console.log('🎯 MESSAGE CONTROLLER INITIALIZED - BULLETPROOF MESSAGING ONLINE!');
  }

  // 🔥 CONNECT TO GAME ENGINE
  connect(gameEngine) {
    this.gameEngine = gameEngine;
    console.log('🎯 MESSAGE CONTROLLER CONNECTED TO GAME ENGINE!');
  }

  // 🎯 MAIN EVENT HANDLER - SINGLE SOURCE OF TRUTH
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

  // 🎯 TURN START - BULLETPROOF CURRENT PLAYER DETECTION
  handleTurnStart(data) {
    const currentPlayer = this.getCurrentPlayer();
    
    console.log(`🎯 TURN START: Player ${currentPlayer}`);
    
    if (currentPlayer === 0) {
      // Player's turn
      const handSize = this.getHandSize(0);
      if (handSize === 0) {
        this.showMessage("You're out of cards! Bots will finish the round.", 'info');
      } else {
        this.showMessage("Your turn! Drag cards to build captures or place one on board to end turn", 'normal');
      }
    } else if (currentPlayer === 1) {
      // Bot 1's turn
      this.showMessage("Bot 1's turn...", 'bot-turn');
    } else if (currentPlayer === 2) {
      // Bot 2's turn  
      this.showMessage("Bot 2's turn...", 'bot-turn');
    } else {
      // Safety fallback
      console.error('🚨 INVALID CURRENT PLAYER:', currentPlayer);
      this.showMessage("Game in progress...", 'normal');
    }
  }

  // 🎯 CARDS IN COMBO AREAS
  handleCardsInCombo(data) {
    const currentPlayer = this.getCurrentPlayer();
    
    if (currentPlayer === 0) {
      this.showMessage("Build your combo and click 'Submit Move' or reset to try again", 'normal');
    } else {
      this.showMessage(`Bot ${currentPlayer} is building a combo...`, 'bot-turn');
    }
  }

  // 🎯 VALID COMBO DETECTED
  handleValidCombo(data) {
    const currentPlayer = this.getCurrentPlayer();
    
    if (currentPlayer === 0) {
      this.showMessage("✅ Valid combo! Click 'Submit Move' to capture these cards", 'success');
    } else {
      this.showMessage(`Bot ${currentPlayer} found a valid combo!`, 'bot-turn');
    }
  }

  // 🎯 CAPTURE SUCCESS
  handleCaptureSuccess(data) {
    const currentPlayer = this.getCurrentPlayer();
    const points = data.points || 0;
    const cardsCount = data.cardsCount || 0;
    
    if (currentPlayer === 0) {
      this.showMessage(`🎉 Capture successful! +${points} points (${cardsCount} cards)`, 'success');
    } else {
      this.showMessage(`Bot ${currentPlayer} captured ${cardsCount} cards for ${points} points!`, 'bot-turn');
    }
    
    // Auto-return to turn message after 3 seconds
    this.currentTimeout = setTimeout(() => {
      this.handleGameEvent('TURN_START');
    }, 3000);
  }

  // 🎯 CAPTURE ERROR
  handleCaptureError(data) {
    const errorMessage = data.message || 'Invalid capture attempt';
    this.showMessage(`❌ ${errorMessage}`, 'error');
    
    // Return to normal message after 4 seconds
    this.currentTimeout = setTimeout(() => {
      this.handleGameEvent('TURN_START');
    }, 4000);
  }

  // 🎯 CARD PLACED ON BOARD
  handleCardPlaced(data) {
    const currentPlayer = this.getCurrentPlayer();
    const cardName = data.cardName || 'card';
    
    if (currentPlayer === 0) {
      this.showMessage(`Card placed on board. Turn ending...`, 'normal');
    } else {
      this.showMessage(`Bot ${currentPlayer} placed ${cardName} on board`, 'bot-turn');
    }
  }

  // 🎯 GAME OVER
  handleGameOver(data) {
    const winner = data.winner || 'Unknown';
    this.showMessage(`🏆 Game Over! ${winner} wins!`, 'game-over');
  }

  // 🎯 ROUND END
  handleRoundEnd(data) {
    this.showMessage("Round complete! Dealing new cards...", 'info');
  }

  // 🎯 BOT THINKING
  handleBotThinking(data) {
    const botNumber = data.botNumber || this.getCurrentPlayer();
    this.showMessage(`Bot ${botNumber} is thinking...`, 'bot-turn');
  }

  // 🎯 PLAYER OUT OF CARDS
  handlePlayerOutOfCards(data) {
    this.showMessage("You're out of cards! Bots will finish the round.", 'info');
  }

  // 🎯 NEW ROUND
  handleNewRound(data) {
    const roundNumber = data.roundNumber || '?';
    this.showMessage(`Round ${roundNumber} starting!`, 'info');
    
    // Switch to turn message after 2 seconds
    this.currentTimeout = setTimeout(() => {
      this.handleGameEvent('TURN_START');
    }, 2000);
  }

  // 🎯 HINT REQUESTED
  handleHintRequested(data) {
    const hintText = data.hintText || 'Try combining the highlighted cards!';
    this.showMessage(`💡 Hint: ${hintText}`, 'hint');
    
    // Return to normal after 5 seconds
    this.currentTimeout = setTimeout(() => {
      this.handleGameEvent('TURN_START');
    }, 5000);
  }

  // 🎯 RESET COMBO
  handleResetCombo(data) {
    this.showMessage("Combo reset! Cards returned to original positions", 'info');
    
    // Return to turn message after 2 seconds
    this.currentTimeout = setTimeout(() => {
      this.handleGameEvent('TURN_START');
    }, 2000);
  }

  // 🎯 CORE MESSAGE DISPLAY FUNCTION - FIXED TO PREVENT DUPLICATES
showMessage(text, type = 'normal') {
  console.log(`🎯 SHOWING MESSAGE: "${text}" (${type})`);
  
  // Update main smart message
  if (this.messageElement) {
    this.messageElement.textContent = text;
    this.messageElement.className = `smart-message ${type}`;
  }
  
  // 🔥 HIDE REGULAR MESSAGE ELEMENT TO PREVENT DUPLICATES
  if (this.regularMessageElement) {
    this.regularMessageElement.style.display = 'none';
  }
  
  // Add sound effects
  this.playMessageSound(type);
}

  // 🎯 PLAY SOUND FOR MESSAGE TYPE
  playMessageSound(type) {
    if (typeof playSound === 'function') {
      switch(type) {
        case 'success':
          playSound('capture');
          break;
        case 'error':
          playSound('invalid');
          break;
        case 'game-over':
          playSound('winner');
          break;
        // No sound for normal messages
      }
    }
  }

  // 🎯 HELPER FUNCTIONS - DIRECT ACCESS TO GAME STATE
  getCurrentPlayer() {
    if (!this.gameEngine || !this.gameEngine.state) {
      console.error('🚨 No game engine connected!');
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

  getBoardSize() {
    if (!this.gameEngine || !this.gameEngine.state || !this.gameEngine.state.board) {
      return 0;
    }
    return this.gameEngine.state.board.length;
  }

  getComboAreaStatus() {
    if (!this.gameEngine || !this.gameEngine.state || !this.gameEngine.state.combination) {
      return { hasCards: false, cardCount: 0 };
    }
    
    const combo = this.gameEngine.state.combination;
    const totalCards = combo.base.length + combo.sum1.length + combo.sum2.length + combo.sum3.length + combo.match.length;
    
    return {
      hasCards: totalCards > 0,
      cardCount: totalCards,
      hasBase: combo.base.length > 0
    };
  }

  // 🎯 DEFAULT MESSAGE
  showDefaultMessage() {
    const currentPlayer = this.getCurrentPlayer();
    
    if (currentPlayer === 0) {
      this.showMessage("Your turn! Drag cards to build captures or place one on board to end turn", 'normal');
    } else {
      this.showMessage(`Bot ${currentPlayer}'s turn...`, 'bot-turn');
    }
  }

  // 🎯 FORCE REFRESH MESSAGE (for manual sync)
  forceRefresh() {
    console.log('🎯 FORCE REFRESH MESSAGE');
    this.handleGameEvent('TURN_START');
  }

  // 🎯 DEBUG FUNCTION
  debugState() {
    console.log('🎯 MESSAGE CONTROLLER DEBUG:');
    console.log('  Current Player:', this.getCurrentPlayer());
    console.log('  Hand Sizes:', [this.getHandSize(0), this.getHandSize(1), this.getHandSize(2)]);
    console.log('  Board Size:', this.getBoardSize());
    console.log('  Combo Status:', this.getComboAreaStatus());
  }
}

// 🎯 GLOBAL MESSAGE CONTROLLER INSTANCE
window.messageController = new MessageController();

// Export for other files
window.MessageController = MessageController;