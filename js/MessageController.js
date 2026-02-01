/*
 * MessageController - Lean game message system
 * Dual message system (#primary-message + #secondary-message), five types: info, success, warning, error, bot
 */

class MessageController {
  constructor() {
    this.el = document.getElementById('primary-message');
    this.secondaryEl = document.getElementById('secondary-message');
    this.gameEngine = null;
    this.currentTimeout = null;
  }

  connect(gameEngine) {
    this.gameEngine = gameEngine;
  }

  // --- Core display ---

  showMessage(text, type = 'info') {
    if (!this.el) this.el = document.getElementById('primary-message');
    if (!this.el) return;
    this.el.textContent = text;
    this.el.classList.remove('info', 'success', 'warning', 'error', 'bot');
    this.el.classList.add(type);
  }

  clearMessage() {
    if (!this.el) return;
    this.el.textContent = '';
    this.el.classList.remove('info', 'success', 'warning', 'error', 'bot');
  }

  // --- Secondary message (context / phase info) ---

  showSecondaryMessage(text) {
    if (!this.secondaryEl) this.secondaryEl = document.getElementById('secondary-message');
    if (!this.secondaryEl) return;
    this.secondaryEl.textContent = text;
    this.secondaryEl.classList.add('visible');
  }

  hideSecondaryMessage() {
    if (!this.secondaryEl) this.secondaryEl = document.getElementById('secondary-message');
    if (!this.secondaryEl) return;
    this.secondaryEl.textContent = '';
    this.secondaryEl.classList.remove('visible');
  }

  // --- Timed message (auto-clears or transitions) ---

  showTimed(text, type, ms, followUp) {
    if (this.currentTimeout) clearTimeout(this.currentTimeout);
    this.showMessage(text, type);
    this.currentTimeout = setTimeout(() => {
      this.currentTimeout = null;
      if (followUp) followUp();
      else this.handleGameEvent('TURN_START');
    }, ms);
  }

  // --- Event router (public API used by main.js, ui.js, botModal.js) ---

  handleGameEvent(eventType, data = {}) {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    switch (eventType) {
      case 'TURN_START':        return this.onTurnStart();
      case 'CARDS_IN_COMBO':    return this.onCardsInCombo();
      case 'CARD_ADDED_TO_COMBO': return; // reserved for educational mode
      case 'COMBO_ANALYSIS':    return; // reserved for educational mode
      case 'VALID_COMBO':       return this.onValidCombo();
      case 'CAPTURE_SUCCESS':   return this.onCaptureSuccess(data);
      case 'CAPTURE_ERROR':     return this.onCaptureError(data);
      case 'CARD_PLACED':       return this.onCardPlaced(data);
      case 'RESET_COMBO':       return this.onResetCombo();
      case 'BOT_THINKING':      return this.onBotThinking(data);
      case 'NEW_HAND':          return this.onNewHand(data);
      case 'NEW_ROUND':         return this.onNewRound(data);
      case 'ROUND_END':
        this.showSecondaryMessage('Dealing new cards...');
        return this.showTimed('Round complete!', 'info', 2000, () => this.hideSecondaryMessage());
      case 'PLAYER_OUT_OF_CARDS':
        this.showSecondaryMessage('Waiting for bots to finish the round...');
        return this.showMessage("You're out of cards!", 'info');
      case 'GAME_OVER':         return this.showMessage(`Game Over! ${data.winner || 'Someone'} wins!`, 'success');
      case 'HINT_REQUESTED':    return this.showTimed(`Hint: ${data.hintText || 'Look for pairs or sums!'}`, 'info', 5000);
      case 'BOT_CAPTURE_EDUCATIONAL':  return; // reserved for educational mode
      case 'BOT_PLACEMENT_EDUCATIONAL': return; // reserved for educational mode
      default:                  return this.onTurnStart();
    }
  }

  // --- Event handlers ---

  onTurnStart() {
    const player = this.getCurrentPlayer();
    if (player === 0) {
      const handSize = this.getHandSize(0);
      if (handSize === 0) {
        this.showMessage("You're out of cards! Watch the bots finish.", 'info');
      } else {
        this.showMessage("Your turn! Drag cards to build captures or place one to end turn.", 'info');
      }
    } else {
      const name = this.getBotDisplayName(player);
      this.showMessage(`${name}'s turn...`, 'bot');
    }
  }

  onCardsInCombo() {
    const player = this.getCurrentPlayer();
    if (player === 0) {
      this.showMessage("Build your combo and click Submit, or Reset to try again.", 'info');
    } else {
      const name = this.getBotDisplayName(player);
      this.showMessage(`${name} is building a combo...`, 'bot');
    }
  }

  onValidCombo() {
    const player = this.getCurrentPlayer();
    if (player === 0) {
      this.showMessage("Valid combo! Click Submit to capture these cards.", 'success');
    } else {
      const name = this.getBotDisplayName(player);
      this.showMessage(`${name} found a valid combo!`, 'bot');
    }
  }

  onCaptureSuccess(data) {
    const player = this.getCurrentPlayer();
    const points = data.points || 0;
    const cards = data.cardsCount || 0;

    if (player === 0) {
      this.showTimed(`Capture successful! +${points} points (${cards} cards)`, 'success', 3000);
    } else {
      const name = this.getBotDisplayName(player);
      this.showTimed(`${name} captured ${cards} cards for ${points} points!`, 'bot', 3000);
    }

  }

  onCaptureError(data) {
    const msg = data.message || 'Invalid capture attempt';
    this.showTimed(`${msg}`, 'error', 4000);
  }

  onCardPlaced(data) {
    const player = this.getCurrentPlayer();
    const card = data.cardName || 'card';

    if (player === 0) {
      this.showMessage(`Card placed on board. Turn ending...`, 'info');
    } else {
      const name = this.getBotDisplayName(player);
      this.showMessage(`${name} placed ${card} on board.`, 'bot');
    }
  }

  onResetCombo() {
    this.showTimed('Combo reset! Cards returned to original positions.', 'info', 2000);
  }

  onBotThinking(data) {
    const botNum = data.botNumber || this.getCurrentPlayer();
    const name = this.getBotDisplayName(botNum);
    this.showMessage(`${name} is thinking...`, 'bot');
  }

  onNewHand(data) {
    const round = data.roundNumber || 1;
    const hand = data.handNumber || '?';
    const total = data.totalHands || '?';
    this.showSecondaryMessage(`Round ${round} — Hand ${hand}/${total}`);
    this.showTimed('New cards dealt!', 'info', 2000, () => this.hideSecondaryMessage());
  }

  onNewRound(data) {
    const round = data.roundNumber || '?';
    this.showSecondaryMessage('Shuffling deck...');
    this.showTimed(`Round ${round} starting!`, 'info', 2000, () => this.hideSecondaryMessage());
  }

  // --- Utilities ---

  getCurrentPlayer() {
    return this.gameEngine?.state?.currentPlayer ?? 0;
  }

  getHandSize(playerIndex) {
    const hands = this.gameEngine?.state?.hands;
    return hands?.[playerIndex]?.length ?? 0;
  }

  getBotDisplayName(playerIndex) {
    const personality = this.getBotPersonality(playerIndex);
    const bot = typeof getPersonality === 'function' ? getPersonality(personality) : null;
    if (!bot) return `Bot ${playerIndex}`;

    const otherIndex = playerIndex === 1 ? 2 : 1;
    if (personality === this.getBotPersonality(otherIndex)) {
      return `${bot.name} #${playerIndex}`;
    }
    return bot.name;
  }

  getBotPersonality(playerIndex) {
    const settings = this.gameEngine?.state?.settings;
    if (!settings) return 'nina';
    if (playerIndex === 1) return settings.bot1Personality || 'nina';
    if (playerIndex === 2) return settings.bot2Personality || 'nina';
    return 'nina';
  }

  forceRefresh() {
    this.handleGameEvent('TURN_START');
  }
}

// Global instance
window.messageController = new MessageController();
window.MessageController = MessageController;
