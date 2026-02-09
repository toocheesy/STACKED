/* 
 * 🔥 FIXED Bot Modal Interface System - PURE UI SIMULATOR
 * 🚨 REMOVED: All turn management and scheduling logic
 * 🎯 PURPOSE: Visual bot action simulator that reports results to main.js
 */

class BotModalInterface {
  constructor(gameEngine, uiSystem) {
    this.game = gameEngine;
    this.ui = uiSystem;
    this.isAnimating = false;
  }

  // 🔥 COMPLETELY REWRITTEN: botDragCardToSlot() - NO MORE CARD STEALING!
  async botDragCardToSlot(card, sourceType, sourceIndex, targetSlot) {
    // 🔥 CRITICAL FIX: Create card entry WITH PLAYER TRACKING to prevent UI conflicts
const currentPlayer = this.game.state.currentPlayer;
const cardEntry = {
  source: sourceType,
  index: sourceIndex,
  card: card,
  playerSource: currentPlayer, // 🔥 NEW: Track which player added this card
  fromBot: currentPlayer !== 0  // 🔥 NEW: Flag bot-added cards
};

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
      this.game.state.combination.base = [];
    }

    // Add card to combo WITHOUT removing from source
this.game.state.combination[targetSlot].push(cardEntry);

// 🔧 NEW: Show the actual bot card visually
this.ui.renderBotComboCard(card, targetSlot, true);

// 🔧 NEW: Highlight the bot combo area
this.ui.highlightBotComboArea(targetSlot);

// Give time to see the combo building
await this.delay(1200); // Increased delay to see bot cards

// Final render to ensure consistency
this.ui.render();

    return true;
  }

  // 🔥 FIXED: executeCapture() - PURE UI SIMULATOR, NO TURN MANAGEMENT
  async executeCapture(move, playerIndex) {
    if (this.isAnimating) return { success: false, reason: 'Already animating' };
    this.isAnimating = true;

    try {
      // Check if combo areas are occupied by previous player
      const totalCardsInCombo = this.game.state.combination.base.length +
                               this.game.state.combination.sum1.length +
                               this.game.state.combination.sum2.length +
                               this.game.state.combination.sum3.length +
                               this.game.state.combination.match.length;
                               
      if (totalCardsInCombo > 0) {
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

      // STEP 2: Place base card with verification
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
        this.isAnimating = false;
        return { success: false, reason: 'Base card placement failed' };
      }
      
      // STEP 3: Add target cards — multi-area or legacy single-area
      if (move.areas) {
        // Multi-area combo: place each group into its designated slot
        for (const area of move.areas) {
          for (const targetCard of area.targets) {
            const boardIndex = this.game.state.board.findIndex(bc => bc.id === targetCard.id);
            if (boardIndex !== -1) {
              await this.botDragCardToSlot(targetCard, 'board', boardIndex, area.slot);
            }
          }
        }
      } else {
        // Legacy single-area: all targets into sum1
        for (const targetCard of move.capture.targets) {
          const boardIndex = this.game.state.board.findIndex(bc => bc.id === targetCard.id);
          if (boardIndex !== -1) {
            await this.botDragCardToSlot(targetCard, 'board', boardIndex, 'sum1');
          }
        }
      }
      
      // STEP 4: Final verification before submit
      const baseCount = this.game.state.combination.base.length;
      const captureCount = this.game.state.combination.sum1.length +
                          this.game.state.combination.sum2.length +
                          this.game.state.combination.sum3.length +
                          this.game.state.combination.match.length;

      if (baseCount === 1 && captureCount > 0) {
        const submitResult = await this.botSubmitCapture();
        this.isAnimating = false;
        return submitResult;
      } else {
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
    await this.delay(300);

    const success = this.executeBotSubmit();

    if (success) {
      return { success: true, action: 'capture' };
    } else {
      return { success: false, reason: 'Submit validation failed' };
    }
  }

  // 🔥 COMPLETELY REWRITTEN: executeBotSubmit() - BULLETPROOF CARD REMOVAL
  executeBotSubmit() {
    const baseCards = this.game.state.combination.base;
    const currentPlayer = this.game.state.currentPlayer;

    if (baseCards.length !== 1) {
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
        } else {
          return false;
        }
      }
    }

    if (validCaptures.length === 0) {
      return false;
    }

    // 🔥 CRITICAL FIX: Use GameEngine's executeCapture() for proper card removal
this.game.executeCapture(baseCard, validCaptures, allCapturedCards);

// 🔥 TRACK BOT LAST ACTION - CRITICAL FOR GAME STATE MANAGER
this.game.state.lastAction = 'capture';

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

    if (totalCards > 0) {
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

// 🔥 TRACK BOT LAST ACTION - CRITICAL FOR GAME STATE MANAGER
this.game.state.lastAction = 'place';
      
      // STEP 3: Add to board IMMEDIATELY
      this.game.state.board.push(handCard);

      // Track placed card for AI intelligence
      if (window.cardIntelligence) {
        window.cardIntelligence.updateCardsSeen([handCard]);
      }

      // STEP 4: Clear combo areas
      this.game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };

      // STEP 5: Update UI immediately
      this.ui.render();
      
      // 🎯 REMOVED: All turn management logic - let main.js handle turns!
      
      this.isAnimating = false;
      return { success: true, action: 'place', remainingCards: this.game.state.hands[playerIndex].length };
      
    } catch (error) {
      console.error(`🚨 CRITICAL ERROR in placeCard:`, error);
      this.isAnimating = false;
      return { success: false, reason: error.message };
    }
  }

  // 🎯 HELPER: Delay function for animations (respects game speed)
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms * (window.gameSpeedMultiplier || 1)));
  }
}

// Export for use in other files
window.BotModalInterface = BotModalInterface;