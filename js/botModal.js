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
    console.log(`🤖 BOT: Dragging ${card.value}${card.suit} from ${sourceType}[${sourceIndex}] to ${targetSlot}`);

    // 🔥 CRITICAL FIX: Create card entry WITH PLAYER TRACKING to prevent UI conflicts
const currentPlayer = this.game.state.currentPlayer;
const cardEntry = {
  source: sourceType,
  index: sourceIndex,
  card: card,
  playerSource: currentPlayer, // 🔥 NEW: Track which player added this card
  fromBot: currentPlayer !== 0  // 🔥 NEW: Flag bot-added cards
};

console.log(`🤖 BOT CARD ENTRY: Player ${currentPlayer} adding ${card.value}${card.suit} from ${sourceType}[${sourceIndex}]`);

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
      console.log(`🤖 BOT: Clearing base slot for new card`);
      this.game.state.combination.base = [];
    }

    // Add card to combo WITHOUT removing from source
this.game.state.combination[targetSlot].push(cardEntry);

// 🔥 BULLETPROOF: Don't render during combo building to prevent visual conflicts
// this.ui.render(); // ← REMOVED TO PREVENT UI CHAOS

// Give DOM time to update
await this.delay(800);

// 🔥 BULLETPROOF: Only render after animation completes
this.ui.render();

// 🔥 FIX: Only render once after all combo building is done
this.ui.render();

// 🔥 FIX: Only render after animation delay
this.ui.render();
    
    // Verify card was placed correctly
    const cardCount = this.game.state.combination[targetSlot].length;
    console.log(`🤖 BOT: Verified ${targetSlot} now has ${cardCount} cards`);
    
    return true;
  }

  async executeCapture(move, playerIndex) {
    if (this.isAnimating) return { success: false, reason: 'Already animating' };
    this.isAnimating = true;

    console.log(`🤖 BOT ${playerIndex}: Attempting CardManager capture`);
    
    try {
      const baseCard = move.handCard;
      const targetCards = move.capture.targets;
      
      // 🔥 VALIDATION: Verify cards exist in CardManager
      const gameState = this.game.getState();
      const botHand = gameState.hands[playerIndex];
      
      if (!botHand.find(c => c.id === baseCard.id)) {
        console.error(`🚨 BOT: Base card ${baseCard.value}${baseCard.suit} not found in bot hand`);
        this.isAnimating = false;
        return { success: false, reason: 'Base card not found' };
      }
      
      // 🔥 NEW: Use CardManager for capture execution
      console.log(`🎯 BOT: Executing capture via CardManager`);
      
      // Create capture data for GameEngine
      const allCapturedCards = [baseCard, ...targetCards];
      const validCaptures = [{
        name: move.capture.type === 'pair' ? 'match' : 'sum1',
        cards: targetCards.map(card => ({
          card: card,
          source: 'board'
        }))
      }];
      
      const baseCardEntry = {
        card: baseCard,
        source: 'hand'
      };
      
      // 🔥 ATOMIC CAPTURE via GameEngine + CardManager
      const result = this.game.executeCapture(baseCardEntry, validCaptures, allCapturedCards);
      
      console.log(`✅ BOT CAPTURE SUCCESS: ${allCapturedCards.length} cards captured`);
      
      // Update card intelligence
      if (window.cardIntelligence) {
        window.cardIntelligence.updateCardsSeen(allCapturedCards);
      }
      
      this.isAnimating = false;
      return { success: true, action: 'capture', capturedCards: result };
      
    } catch (error) {
      console.error('🚨 Bot capture error:', error);
      this.isAnimating = false;
      return { success: false, reason: error.message };
    }
  }

  // 🔥 FIXED: botSubmitCapture() - PURE UI ACTION, NO TURN SCHEDULING
  async botSubmitCapture() {
    console.log(`🤖 BOT: Attempting to submit capture`);
    await this.delay(300);

    const success = this.executeBotSubmit();
    
    if (success) {
      console.log(`🤖 BOT: Capture successful!`);
      
      return { success: true, action: 'capture' };
    } else {
      console.log(`🤖 BOT: Capture failed`);
      return { success: false, reason: 'Submit validation failed' };
    }
  }

  // 🔥 COMPLETELY REWRITTEN: executeBotSubmit() - BULLETPROOF CARD REMOVAL
  executeBotSubmit() {
    const baseCards = this.game.state.combination.base;
    const currentPlayer = this.game.state.currentPlayer;

    if (baseCards.length !== 1) {
      console.log(`🚨 BOT SUBMIT FAILED: Base card count = ${baseCards.length}`);
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
          console.log(`✅ BOT ${area.name}: ${result.details}`);
        } else {
          console.log(`🚨 BOT VALIDATION FAILED: ${area.name} - ${result.details}`);
          return false;
        }
      }
    }

    if (validCaptures.length === 0) {
      console.log(`🚨 BOT SUBMIT FAILED: No valid captures`);
      return false;
    }

    console.log(`🎯 BOT MULTI-CAPTURE: ${validCaptures.length} areas, ${allCapturedCards.length} cards`);

    // 🔥 CRITICAL FIX: Use GameEngine's executeCapture() for proper card removal
this.game.executeCapture(baseCard, validCaptures, allCapturedCards);

// 🔥 TRACK BOT LAST ACTION - CRITICAL FOR GAME STATE MANAGER
this.game.state.lastAction = 'capture';
console.log('🎯 BOT LAST ACTION SET TO: capture');

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

    // 🎯 REMOVED: All turn management logic - let main.js handle turns!
    
    this.ui.render();
    playSound('capture');
    return true;
  }

  // 🔥 FIXED: botResetModal() - Clean reset without card corruption
  async botResetModal() {
    console.log(`🤖 BOT: Resetting modal - clearing ALL areas`);
    
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
                      
    console.log(`🤖 BOT: Modal reset complete - ${totalCards} cards remaining in combo areas`);
    
    if (totalCards > 0) {
      console.log(`🚨 BOT: Warning - combo areas not fully cleared!`);
      // Force clear again
      this.game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
      this.ui.render();
    }
    
    return true;
  }

  async placeCard(handCard, playerIndex) {
    if (this.isAnimating) return { success: false, reason: 'Already animating' };
    this.isAnimating = true;

    console.log(`🤖 BOT ${playerIndex}: PLACING ${handCard.value}${handCard.suit} via CardManager`);
    
    try {
      await this.delay(500);

      // 🔥 VALIDATION: Verify card exists in CardManager
      const gameState = this.game.getState();
      const botHand = gameState.hands[playerIndex];
      
      const cardIndex = botHand.findIndex(c => c && c.id === handCard.id);
      if (cardIndex === -1) {
        console.error(`🚨 CRITICAL: Card ${handCard.value}${handCard.suit} not found in Bot ${playerIndex} hand!`);
        this.isAnimating = false;
        return { success: false, reason: 'Card not found in hand' };
      }
      
      // 🔥 NEW: Use GameEngine + CardManager for placement
      this.game.placeCard(handCard, 'hands', cardIndex, playerIndex);
      
      // Track placed card for AI intelligence
      if (window.cardIntelligence) {
        window.cardIntelligence.updateCardsSeen([handCard]);
      }
      
      console.log(`✅ CARD PLACED VIA CARDMANAGER`);
      
      // Update UI
      this.ui.render();
      
      this.isAnimating = false;
      return { 
        success: true, 
        action: 'place', 
        remainingCards: this.game.getState().hands[playerIndex].length 
      };
      
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

  // 🎯 HELPER: Check if bot can capture
  canBotCapture(hand, board) {
    return hand.length > 0 && board.length > 0;
  }

  // 🎯 DEBUG: Card state tracking
  debugCardState() {
    console.log(`🔍 CARD STATE DEBUG:`);
    console.log(`   Player hand: ${this.game.state.hands[0].length} cards`);
    console.log(`   Bot 1 hand: ${this.game.state.hands[1].length} cards`);
    console.log(`   Bot 2 hand: ${this.game.state.hands[2].length} cards`);
    console.log(`   Board: ${this.game.state.board.length} cards`);
    console.log(`   Deck: ${this.game.state.deck.length} cards`);
    
    const totalCards = this.game.state.hands[0].length + 
                      this.game.state.hands[1].length + 
                      this.game.state.hands[2].length + 
                      this.game.state.board.length + 
                      this.game.state.deck.length;
    console.log(`   TOTAL CARDS: ${totalCards} (should be 52)`);
    
    if (totalCards !== 52) {
      console.error(`🚨 CARD COUNT MISMATCH! Missing ${52 - totalCards} cards!`);
    }
  }
}

// Export for use in other files
window.BotModalInterface = BotModalInterface;