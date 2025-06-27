/* 
 * Enhanced Bot Modal Interface System
 * Works with the new GameEngine and UISystem
 * Handles bot interactions with combo areas
 */

class BotModalInterface {
  constructor(gameEngine, uiSystem) {
    this.game = gameEngine;
    this.ui = uiSystem;
    this.isAnimating = false;
  }

  async botDragCardToSlot(card, sourceType, sourceIndex, targetSlot) {
  if (this.isAnimating) return false;

  console.log(`🤖 BOT: Dragging ${card.value}${card.suit} from ${sourceType}[${sourceIndex}] to ${targetSlot}`);

  const cardEntry = {
    source: sourceType,
    index: sourceIndex,
    card: card
  };

  // CRITICAL FIX: Clear base slot completely if targeting base
  if (targetSlot === 'base') {
    console.log(`🤖 BOT: Clearing base slot for new card`);
    this.game.state.combination.base = [];
  }

  // Add card to target slot
  this.game.state.combination[targetSlot].push(cardEntry);
  
  // CRITICAL: Force render to update DOM immediately
  this.ui.render();
  
  // LONGER DELAY: Give DOM time to update
  await this.delay(800);
  
  // VERIFY: Check that card was actually placed
  const cardCount = this.game.state.combination[targetSlot].length;
  console.log(`🤖 BOT: Verified ${targetSlot} now has ${cardCount} cards`);
  
  return true;
}

  async executeCapture(move, playerIndex) {
  if (this.isAnimating) return false;
  this.isAnimating = true;

  console.log(`🤖 BOT ${playerIndex}: Attempting modal capture`);
  const baseCard = move.handCard;
  const handIndex = this.game.state.hands[playerIndex].findIndex(c => c.id === baseCard.id);

  if (handIndex !== -1) {
    try {
      // STEP 1: Reset modal completely
      await this.botResetModal();
      console.log(`🤖 BOT: Modal reset complete`);
      
      // STEP 2: Place base card with verification
      console.log(`🤖 BOT: Placing base card ${baseCard.value}${baseCard.suit}`);
      await this.botDragCardToSlot(baseCard, 'hand', handIndex, 'base');
      
      // STEP 3: Verify base card is there
      if (this.game.state.combination.base.length !== 1) {
        console.log(`🚨 BOT: Base card failed to place! Count: ${this.game.state.combination.base.length}`);
        this.fallbackPlaceCard(baseCard, playerIndex);
        this.isAnimating = false;
        return false;
      }
      console.log(`✅ BOT: Base card verified in place`);
      
      // STEP 4: Add target cards one by one with verification
      for (const targetCard of move.capture.targets) {
        const boardIndex = this.game.state.board.findIndex(bc => bc.id === targetCard.id);
        if (boardIndex !== -1) {
          console.log(`🤖 BOT: Adding target card ${targetCard.value}${targetCard.suit}`);
          await this.botDragCardToSlot(targetCard, 'board', boardIndex, 'sum1');
        }
      }
      
      // STEP 5: Final verification before submit
      const baseCount = this.game.state.combination.base.length;
      const captureCount = this.game.state.combination.sum1.length + 
                          this.game.state.combination.sum2.length + 
                          this.game.state.combination.sum3.length + 
                          this.game.state.combination.match.length;
                          
      console.log(`🤖 BOT: Final check - Base: ${baseCount}, Captures: ${captureCount}`);
      
      if (baseCount === 1 && captureCount > 0) {
        await this.botSubmitCapture();
      } else {
        console.log(`🚨 BOT: Final verification failed - Base: ${baseCount}, Captures: ${captureCount}`);
        this.fallbackPlaceCard(baseCard, playerIndex);
      }
    } catch (error) {
      console.error('🚨 Bot capture error:', error);
      this.fallbackPlaceCard(baseCard, playerIndex);
    }
  }

  this.isAnimating = false;
}

  async botSubmitCapture() {
    console.log(`🤖 BOT: Attempting to submit capture`);
    await this.delay(300);

    const success = this.executeBotSubmit();
    
    if (success) {
      console.log(`🤖 BOT: Capture successful!`);
      const currentPlayer = this.game.state.currentPlayer;
      if (this.game.state.hands[currentPlayer].length > 0) {
        console.log(`🤖 BOT ${currentPlayer}: Has ${this.game.state.hands[currentPlayer].length} cards left, continuing turn`);
        setTimeout(async () => await aiTurn(), 1000);
      } else {
        console.log(`🤖 BOT ${currentPlayer}: Out of cards, turn managed in submit`);
      }
    } else {
      console.log(`🤖 BOT: Capture failed, placing card instead`);
    }

    return success;
  }

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

    // Execute capture through game engine
    this.game.executeCapture(baseCard, validCaptures, allCapturedCards);

    // Notify mode of capture
    if (this.game.currentMode.onCapture) {
      this.game.currentMode.onCapture(this.game, allCapturedCards);
    }

    // Reset combination state
    this.game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };

    // Handle turn continuation
    if (this.game.state.hands[currentPlayer].length > 0) {
      console.log(`🤖 BOT ${currentPlayer}: Can continue, staying current player`);
    } else {
      this.game.nextPlayer();
      console.log(`🤖 BOT ${currentPlayer}: Out of cards, switching to player ${this.game.state.currentPlayer}`);
      if (this.game.state.currentPlayer !== 0 && this.game.state.hands[this.game.state.currentPlayer] && this.game.state.hands[this.game.state.currentPlayer].length > 0) {
        setTimeout(async () => await scheduleNextBotTurn(), 1000);
      }
    }

    this.ui.render();
    playSound('capture');
    return true;
  }

  async botResetModal() {
    if (this.isAnimating) return false;
    this.isAnimating = true;

    console.log(`🤖 BOT: Resetting modal`);
    this.game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
    this.ui.render();
    await this.delay(300);
    this.isAnimating = false;
    return true;
  }

  async placeCard(handCard, playerIndex) {
    if (this.isAnimating) return false;
    this.isAnimating = true;

    console.log(`🤖 BOT: Placing ${handCard.value}${handCard.suit} on board to end turn`);
    await this.delay(500);

    this.game.state.board.push(handCard);
    this.game.state.hands[playerIndex] = this.game.state.hands[playerIndex].filter(card => card.id !== handCard.id);
    this.game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
    this.game.nextPlayer();
    
    this.ui.render();
    checkGameEnd();

    if (this.game.state.currentPlayer !== 0 && this.game.state.hands[this.game.state.currentPlayer] && this.game.state.hands[this.game.state.currentPlayer].length > 0) {
      console.log(`🔄 BOT PLACED CARD - CONTINUING TO PLAYER ${this.game.state.currentPlayer}`);
      setTimeout(async () => await scheduleNextBotTurn(), 1000);
    }

    this.isAnimating = false;
    return true;
  }

  fallbackPlaceCard(handCard, playerIndex) {
    console.log(`🔄 BOT FALLBACK: Placing card instead of capturing`);
    this.placeCard(handCard, playerIndex);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  canBotCapture(hand, board) {
    return hand.length > 0 && board.length > 0;
  }
}

// Export for use in other files
window.BotModalInterface = BotModalInterface;