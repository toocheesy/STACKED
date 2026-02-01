/* 
 * 🔥 FIXED Bot Modal Interface System - PURE UI SIMULATOR
 * 🚨 REMOVED: All turn management and scheduling logic
 * 🎯 PURPOSE: Visual bot action simulator that reports results to main.js
 */

// 🔧 PRODUCTION DEBUG TOGGLE
const DEBUG_CONFIG = {
  BOT_ACTIONS: false,    // Set to false for production
  ERRORS: true,
  SETUP: false,
};

function debugLog(category, ...args) {
  if (DEBUG_CONFIG[category]) {
    console.log(...args);
  }
}

function debugError(...args) {
  if (DEBUG_CONFIG.ERRORS) {
    console.error(...args);
  }
}

class BotModalInterface {
  constructor(gameEngine, uiSystem) {
    this.game = gameEngine;
    this.ui = uiSystem;
    this.isAnimating = false;
  }

  // 🔥 COMPLETELY REWRITTEN: botDragCardToSlot() - NO MORE CARD STEALING!
  async botDragCardToSlot(card, sourceType, sourceIndex, targetSlot) {
    debugLog('BOT_ACTIONS', `🤖 BOT: Dragging ${card.value}${card.suit} from ${sourceType}[${sourceIndex}] to ${targetSlot}`);

    // 🔥 CRITICAL FIX: Create card entry WITH PLAYER TRACKING to prevent UI conflicts
const currentPlayer = this.game.state.currentPlayer;
const cardEntry = {
  source: sourceType,
  index: sourceIndex,
  card: card,
  playerSource: currentPlayer, // 🔥 NEW: Track which player added this card
  fromBot: currentPlayer !== 0  // 🔥 NEW: Flag bot-added cards
};

debugLog('BOT_ACTIONS', `🤖 BOT CARD ENTRY: Player ${currentPlayer} adding ${card.value}${card.suit} from ${sourceType}[${sourceIndex}]`);

    // 🔥 SAFETY CHECK: Verify card exists in source location
    if (sourceType === 'hand') {
      const currentPlayer = this.game.state.currentPlayer;
      if (!this.game.state.hands[currentPlayer][sourceIndex] || 
          this.game.state.hands[currentPlayer][sourceIndex].id !== card.id) {
        console.error(`🚨 CARD MISMATCH: Expected ${card.value}${card.suit} at hand[${sourceIndex}] for player ${currentPlayer}`);
        return false;
      }
    } else if (sourceType === 'board') {
      if (!this.game.state.board[sourceIndex] || 
          this.game.state.board[sourceIndex].id !== card.id) {
        console.error(`🚨 CARD MISMATCH: Expected ${card.value}${card.suit} at board[${sourceIndex}]`);
        return false;
      }
    }

    // Clear base slot completely if targeting base
    if (targetSlot === 'base') {
      debugLog('BOT_ACTIONS', `🤖 BOT: Clearing base slot for new card`);
      this.game.state.combination.base = [];
    }

    // Add card to combo WITHOUT removing from source
this.game.state.combination[targetSlot].push(cardEntry);

// 🔧 NEW: Show the actual bot card visually
this.ui.renderBotComboCard(card, targetSlot, true);

// 🔧 NEW: Highlight the bot combo area
this.ui.highlightBotComboArea(targetSlot);

debugLog('BOT_ACTIONS', `🎯 BOT COMBO: ${targetSlot} now has ${this.game.state.combination[targetSlot].length} cards`);

// Give time to see the combo building
await this.delay(1200); // Increased delay to see bot cards

// Final render to ensure consistency
this.ui.render();
    
    // Verify card was placed correctly
    const cardCount = this.game.state.combination[targetSlot].length;
    debugLog('BOT_ACTIONS', `🤖 BOT: Verified ${targetSlot} now has ${cardCount} cards`);
    
    return true;
  }

  // 🔥 FIXED: executeCapture() - PURE UI SIMULATOR, NO TURN MANAGEMENT
  async executeCapture(move, playerIndex) {
    if (this.isAnimating) return { success: false, reason: 'Already animating' };
    this.isAnimating = true;

    debugLog('BOT_ACTIONS', `🤖 BOT ${playerIndex}: Attempting modal capture`);
    
    try {
      // Check if combo areas are occupied by previous player
      const totalCardsInCombo = this.game.state.combination.base.length +
                               this.game.state.combination.sum1.length +
                               this.game.state.combination.sum2.length +
                               this.game.state.combination.sum3.length +
                               this.game.state.combination.match.length;
                               
      if (totalCardsInCombo > 0) {
        debugLog('BOT_ACTIONS', `🤖 BOT: Combo areas occupied (${totalCardsInCombo} cards), clearing first`);
        await this.botResetModal();
      }
      
      const baseCard = move.handCard;
      const handIndex = this.game.state.hands[playerIndex].findIndex(c => c.id === baseCard.id);

      if (handIndex === -1) {
        console.error(`🚨 BOT: Base card not found in hand`);
        this.isAnimating = false;
        return { success: false, reason: 'Base card not found' };
      }

      // STEP 1: Reset modal completely
      await this.botResetModal();
      debugLog('BOT_ACTIONS', `🤖 BOT: Modal reset complete`);
      
      // STEP 2: Place base card with verification
debugLog('BOT_ACTIONS', `🤖 BOT: Placing base card ${baseCard.value}${baseCard.suit}`);
const baseSuccess = await this.botDragCardToSlot(baseCard, 'hand', handIndex, 'base');

// 🔧 NEW: Send message about bot combo building
if (window.messageController?.handleGameEvent) {
  window.messageController.handleGameEvent('CARDS_IN_COMBO', {
    hasCards: true,
    cardCount: 1,
    hasBase: true,
    baseCard: baseCard,
    sumCards: 0,
    matchCards: 0
  });
}
      
      if (!baseSuccess || this.game.state.combination.base.length !== 1) {
        debugLog('BOT_ACTIONS', `🚨 BOT: Base card failed to place! Count: ${this.game.state.combination.base.length}`);
        this.isAnimating = false;
        return { success: false, reason: 'Base card placement failed' };
      }
      debugLog('BOT_ACTIONS', `✅ BOT: Base card verified in place`);
      
      // STEP 3: Add target cards one by one with verification
for (const targetCard of move.capture.targets) {
  const boardIndex = this.game.state.board.findIndex(bc => bc.id === targetCard.id);
  if (boardIndex !== -1) {
    debugLog('BOT_ACTIONS', `🤖 BOT: Adding target card ${targetCard.value}${targetCard.suit}`);
    await this.botDragCardToSlot(targetCard, 'board', boardIndex, 'sum1');
    
    // 🔧 NEW: Update combo status message
    const currentCount = this.game.state.combination.base.length + 
                        this.game.state.combination.sum1.length + 
                        this.game.state.combination.sum2.length + 
                        this.game.state.combination.sum3.length + 
                        this.game.state.combination.match.length;
    
    if (window.messageController?.handleGameEvent) {
      window.messageController.handleGameEvent('CARDS_IN_COMBO', {
        hasCards: true,
        cardCount: currentCount,
        hasBase: true,
        baseCard: baseCard,
        sumCards: currentCount - 1,
        matchCards: 0
      });
    }
  }
}
      
      // STEP 4: Final verification before submit
      const baseCount = this.game.state.combination.base.length;
      const captureCount = this.game.state.combination.sum1.length + 
                          this.game.state.combination.sum2.length + 
                          this.game.state.combination.sum3.length + 
                          this.game.state.combination.match.length;
                          
      debugLog('BOT_ACTIONS', `🤖 BOT: Final check - Base: ${baseCount}, Captures: ${captureCount}`);
      
      if (baseCount === 1 && captureCount > 0) {
        const submitResult = await this.botSubmitCapture();
        this.isAnimating = false;
        return submitResult;
      } else {
        debugLog('BOT_ACTIONS', `🚨 BOT: Final verification failed - Base: ${baseCount}, Captures: ${captureCount}`);
        this.isAnimating = false;
        return { success: false, reason: 'Final verification failed' };
      }
      
    } catch (error) {
      console.error('🚨 Bot capture error:', error);
      this.isAnimating = false;
      return { success: false, reason: error.message };
    }
  }

  // 🔥 FIXED: botSubmitCapture() - PURE UI ACTION, NO TURN SCHEDULING
  async botSubmitCapture() {
    debugLog('BOT_ACTIONS', `🤖 BOT: Attempting to submit capture`);
    await this.delay(300);

    const success = this.executeBotSubmit();
    
    if (success) {
      debugLog('BOT_ACTIONS', `🤖 BOT: Capture successful!`);
      
      return { success: true, action: 'capture' };
    } else {
      debugLog('BOT_ACTIONS', `🤖 BOT: Capture failed`);
      return { success: false, reason: 'Submit validation failed' };
    }
  }

  // 🔥 COMPLETELY REWRITTEN: executeBotSubmit() - BULLETPROOF CARD REMOVAL
  executeBotSubmit() {
    const baseCards = this.game.state.combination.base;
    const currentPlayer = this.game.state.currentPlayer;

    if (baseCards.length !== 1) {
      debugLog('BOT_ACTIONS', `🚨 BOT SUBMIT FAILED: Base card count = ${baseCards.length}`);
      return false;
    }

    const baseCard = baseCards[0];
    const baseValue = baseCard.card.value;

    let validCaptures = [];
    let allCapturedCards = [baseCard.card];

    const captureAreas = [
      { name: 'sum1', cards: this.game.state.combination.sum1 },
      { name: 'sum2', cards: this.game.state.combination.sum2 },
      { name: 'sum3', cards: this.game.state.combination.sum3 },
      { name: 'match', cards: this.game.state.combination.match }
    ];

    for (const area of captureAreas) {
      if (area.cards.length > 0) {
        const result = this.game.validateCapture(area.cards, baseValue, baseCard, area.name);

        if (result.isValid) {
          validCaptures.push({ name: area.name, cards: area.cards, type: result.captureType });
          allCapturedCards.push(...area.cards.map(entry => entry.card));
          debugLog('BOT_ACTIONS', `✅ BOT ${area.name}: ${result.details}`);
        } else {
          debugLog('BOT_ACTIONS', `🚨 BOT VALIDATION FAILED: ${area.name} - ${result.details}`);
          return false;
        }
      }
    }

    if (validCaptures.length === 0) {
      debugLog('BOT_ACTIONS', `🚨 BOT SUBMIT FAILED: No valid captures`);
      return false;
    }

    debugLog('BOT_ACTIONS', `🎯 BOT MULTI-CAPTURE: ${validCaptures.length} areas, ${allCapturedCards.length} cards`);

    // 🔥 CRITICAL FIX: Use GameEngine's executeCapture() for proper card removal
this.game.executeCapture(baseCard, validCaptures, allCapturedCards);

// 🔥 TRACK BOT LAST ACTION - CRITICAL FOR GAME STATE MANAGER
this.game.state.lastAction = 'capture';
debugLog('BOT_ACTIONS', '🎯 BOT LAST ACTION SET TO: capture');

// Track captured cards for AI intelligence
if (window.cardIntelligence) {
  window.cardIntelligence.updateCardsSeen(allCapturedCards);
}

    // Notify mode of capture
    if (this.game.currentMode.onCapture) {
      this.game.currentMode.onCapture(this.game, allCapturedCards);
    }

    // Reset combination state
this.game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };

// Clean up bot combo card visuals
this.ui.cleanupBotComboVisuals();

this.ui.render();
return true;
}

  // 🔥 FIXED: botResetModal() - Clean reset without card corruption
  async botResetModal() {
    debugLog('BOT_ACTIONS', `🤖 BOT: Resetting modal - clearing ALL areas`);
    
    // Clean reset: Clear combo areas without touching source arrays
    this.game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
    
    this.ui.render();
    await this.delay(500);
    
    // Verify all areas are empty
    const totalCards = this.game.state.combination.base.length +
                      this.game.state.combination.sum1.length +
                      this.game.state.combination.sum2.length +
                      this.game.state.combination.sum3.length +
                      this.game.state.combination.match.length;
                      
    debugLog('BOT_ACTIONS', `🤖 BOT: Modal reset complete - ${totalCards} cards remaining in combo areas`);
    
    if (totalCards > 0) {
      debugLog('BOT_ACTIONS', `🚨 BOT: Warning - combo areas not fully cleared!`);
      // Force clear again
      this.game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
      this.ui.render();
    }
    
    return true;
  }

  // 🔥 FIXED: placeCard() - PURE UI ACTION, NO TURN MANAGEMENT
  async placeCard(handCard, playerIndex) {
    if (this.isAnimating) return { success: false, reason: 'Already animating' };
    this.isAnimating = true;

    // 🚨 CRITICAL SAFETY CHECK: Verify bot has cards before attempting to place
    if (!this.game.state.hands[playerIndex] || this.game.state.hands[playerIndex].length === 0) {
      console.error(`🚨 SAFETY GUARD: Bot ${playerIndex} has no cards to place!`);
      this.isAnimating = false;
      return { success: false, reason: 'No cards available' };
    }

    // 🚨 SAFETY CHECK: Verify handCard exists
    if (!handCard || !handCard.value || !handCard.suit) {
      console.error(`🚨 SAFETY GUARD: Invalid handCard provided to placeCard!`, handCard);
      this.isAnimating = false;
      return { success: false, reason: 'Invalid card' };
    }

    debugLog('BOT_ACTIONS', `🤖 BOT ${playerIndex}: PLACING ${handCard.value}${handCard.suit} on board`);
    
    try {
      await this.delay(500);

      // STEP 1: Verify card exists in bot's hand
      const cardIndex = this.game.state.hands[playerIndex].findIndex(c => c && c.id === handCard.id);
      if (cardIndex === -1) {
        console.error(`🚨 CRITICAL: Card ${handCard.value}${handCard.suit} not found in Bot ${playerIndex} hand!`);
        this.isAnimating = false;
        return { success: false, reason: 'Card not found in hand' };
      }
      
      // STEP 2: Remove from bot's hand ATOMICALLY
this.game.state.hands[playerIndex].splice(cardIndex, 1);
debugLog('BOT_ACTIONS', `✅ REMOVED: ${handCard.value}${handCard.suit} from Bot ${playerIndex} hand (${this.game.state.hands[playerIndex].length} cards left)`);

// 🔥 TRACK BOT LAST ACTION - CRITICAL FOR GAME STATE MANAGER
this.game.state.lastAction = 'place';
debugLog('BOT_ACTIONS', '🚨 BOT LAST ACTION SET TO: place');
      
      // STEP 3: Add to board IMMEDIATELY
      this.game.state.board.push(handCard);

      // Track placed card for AI intelligence
      if (window.cardIntelligence) {
        window.cardIntelligence.updateCardsSeen([handCard]);
      }
      
      debugLog('BOT_ACTIONS', `✅ ADDED: ${handCard.value}${handCard.suit} to board (${this.game.state.board.length} cards total)`);
      
      // STEP 4: Clear combo areas
      this.game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
      debugLog('BOT_ACTIONS', `✅ CLEARED: All combo areas`);
      
      // STEP 5: Update UI immediately
      this.ui.render();
      debugLog('BOT_ACTIONS', `✅ RENDERED: UI updated`);
      
      // 🎯 REMOVED: All turn management logic - let main.js handle turns!
      
      this.isAnimating = false;
      return { success: true, action: 'place', remainingCards: this.game.state.hands[playerIndex].length };
      
    } catch (error) {
      console.error(`🚨 CRITICAL ERROR in placeCard:`, error);
      this.isAnimating = false;
      return { success: false, reason: error.message };
    }
  }

  // 🎯 HELPER: Delay function for animations
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use in other files
window.BotModalInterface = BotModalInterface;