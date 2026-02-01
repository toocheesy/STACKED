// Saved features to wire up later - toast notifications & educational mode
// Extracted from MessageController.js before rebuild
// These methods need HTML elements and CSS to be created before they'll work

// ============================================================================
// TOAST NOTIFICATION SYSTEM
// Requires: <div id="modal-toast-container"></div> in game.html
// Requires: .modal-toast CSS + @keyframes modalToastSlideOut
// ============================================================================

/*
showModalToast(message, type = 'normal', duration = 4500) {
  const container = document.getElementById('modal-toast-container');
  if (!container) return;

  container.innerHTML = '';

  const toast = document.createElement('div');
  toast.className = `modal-toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'modalToastSlideOut 0.3s ease-in forwards';
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300);
  }, duration);
}
*/

// ============================================================================
// SCORE ANIMATION SYSTEM
// Requires: .score-animation CSS + keyframes
// ============================================================================

/*
showScoreAnimation(playerIndex, points) {
  const scoreElements = [
    document.getElementById('player-score'),
    document.getElementById('bot1-score'),
    document.getElementById('bot2-score')
  ];

  const scoreEl = scoreElements[playerIndex];
  if (!scoreEl) return;

  const animation = document.createElement('div');
  animation.className = `score-animation ${points >= 50 ? 'jackpot' : points >= 25 ? 'big' : 'normal'}`;
  animation.textContent = `+${points}`;

  const rect = scoreEl.getBoundingClientRect();
  animation.style.left = `${rect.left + rect.width / 2}px`;
  animation.style.top = `${rect.top}px`;

  document.body.appendChild(animation);

  setTimeout(() => {
    if (animation.parentNode) {
      animation.parentNode.removeChild(animation);
    }
  }, 2000);
}
*/

// ============================================================================
// EDUCATIONAL MODE METHODS
// These provide step-by-step guidance for beginners
// Toggle with: messageController.toggleEducationalMode()
// ============================================================================

/*
// --- State needed ---
// this.educationalMode = false;
// this.comboGuidanceActive = false;

toggleEducationalMode() {
  this.educationalMode = !this.educationalMode;
  this.forceRefresh();
}

// --- Hand analysis (finds pairs & sums in player's hand vs board) ---

analyzePlayerHand() {
  const hand = this.gameEngine.state.hands[0] || [];
  const board = this.gameEngine.state.board || [];

  if (hand.length === 0 || board.length === 0) {
    return "Your turn! Drag cards to build combos or place one on board to end turn";
  }

  const pairOpportunities = this.findPairOpportunities(hand, board);
  if (pairOpportunities.length > 0) {
    const example = pairOpportunities[0];
    return `Great! You have ${example.handCard} in hand and ${example.boardCard} on board - that's a PAIR! Try it!`;
  }

  const sumOpportunities = this.findSimpleSumOpportunities(hand, board);
  if (sumOpportunities.length > 0) {
    const example = sumOpportunities[0];
    return `Nice! Try this SUM: ${example.handCard} + ${example.boardCard} = ${example.target}. Look for the ${example.target} on board!`;
  }

  const faceCards = hand.filter(card => ['J', 'Q', 'K'].includes(card.value));
  if (faceCards.length > 0) {
    return `You have valuable face cards (${faceCards.map(c => c.value).join(', ')})! Look for matching pairs, or save them for later.`;
  }

  return "Your turn! Look for pairs (same values) or sums (numbers that add up). Drag cards to combo areas to try!";
}

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

findSimpleSumOpportunities(hand, board) {
  const opportunities = [];
  hand.forEach(handCard => {
    const handValue = this.getCardNumericValue(handCard);
    if (handValue === null || handValue > 10) return;
    board.forEach(boardCard => {
      const boardValue = this.getCardNumericValue(boardCard);
      if (boardValue === null || boardValue > 10) return;
      const sum = handValue + boardValue;
      if (sum <= 10) {
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

// --- Real-time combo guidance ---

handleCardAddedToCombo(data) {
  if (!this.educationalMode) return;
  const slot = data.slot || '';
  const cardName = data.cardName || 'card';
  this.comboGuidanceActive = true;

  if (slot === 'base') {
    this.showMessage(`Great start! ${cardName} is now your BASE card. Now find matching cards or numbers that add up to ${this.getCardNumericValue(data.card) || 'it'}!`, 'info');
  } else if (slot.includes('sum')) {
    this.showMessage(`Good! Added ${cardName} to sum area. Keep adding cards that add up to your base card!`, 'info');
  } else if (slot === 'match') {
    this.showMessage(`Perfect! Added ${cardName} to match area. Look for more cards with the same value!`, 'info');
  }

  this.currentTimeout = setTimeout(() => {
    this.analyzeCurrentCombo();
  }, 1500);
}

analyzeCurrentCombo() {
  if (!this.educationalMode || !this.comboGuidanceActive) return;
  const combo = this.gameEngine.state.combination;
  const hasBase = combo.base.length > 0;
  const hasCaptureCards = combo.sum1.length + combo.sum2.length + combo.sum3.length + combo.match.length > 0;

  if (hasBase && hasCaptureCards) {
    const baseCard = combo.base[0];
    const baseValue = this.getCardNumericValue(baseCard.card);
    if (combo.match.length > 0) {
      const allMatch = combo.match.every(entry => entry.card.value === baseCard.card.value);
      if (allMatch) {
        this.showMessage(`Excellent PAIR combo! All ${baseCard.card.value}s match. Click Submit to capture!`, 'success');
      } else {
        this.showMessage(`Not all cards match ${baseCard.card.value}. For pairs, all cards need the same value!`, 'warning');
      }
    } else if (combo.sum1.length > 0 || combo.sum2.length > 0 || combo.sum3.length > 0) {
      if (baseValue && baseValue <= 10) {
        this.showMessage(`Building a SUM combo! Make sure your sum cards add up to ${baseValue}.`, 'info');
      } else {
        this.showMessage(`Face cards (J, Q, K) can only make pairs, not sums. Try the match area instead!`, 'warning');
      }
    }
  } else if (hasBase && !hasCaptureCards) {
    const baseCard = combo.base[0];
    const suggestions = this.suggestNextCards(baseCard.card);
    this.showMessage(suggestions, 'info');
  }
}

suggestNextCards(baseCard) {
  const baseValue = this.getCardNumericValue(baseCard);
  const board = this.gameEngine.state.board || [];
  const hand = this.gameEngine.state.hands[0] || [];

  const matchingCards = [...board, ...hand].filter(card =>
    card.value === baseCard.value && card.id !== baseCard.id
  );

  if (matchingCards.length > 0) {
    const examples = matchingCards.slice(0, 2).map(card =>
      `${card.value}${this.getSuitSymbol(card.suit)}`
    ).join(' or ');
    return `Your base is ${baseCard.value}${this.getSuitSymbol(baseCard.suit)}. Look for ${examples} to make a pair!`;
  }

  if (baseValue && baseValue <= 10) {
    const possibleSums = [];
    board.forEach(boardCard => {
      hand.forEach(handCard => {
        const bv = this.getCardNumericValue(boardCard);
        const hv = this.getCardNumericValue(handCard);
        if (bv && hv && bv + hv === baseValue) {
          possibleSums.push(`${handCard.value}+${boardCard.value}`);
        }
      });
    });
    if (possibleSums.length > 0) {
      return `Your base is ${baseValue}. Try sum: ${possibleSums[0]} = ${baseValue}!`;
    }
  }

  return `Your base is ${baseCard.value}${this.getSuitSymbol(baseCard.suit)}. Look for matching ${baseCard.value}s or numbers that add up to ${baseValue || 'it'}!`;
}

// --- Educational bot explanations ---

handleBotCaptureEducational(data) {
  const currentPlayer = this.getCurrentPlayer();
  const captureType = data.captureType || 'unknown';
  const points = data.points || 0;
  const explanation = data.explanation || '';
  const displayName = this.getBotDisplayName(currentPlayer);

  let message = '';
  if (captureType === 'pair') {
    message = `${displayName} found a PAIR! ${explanation} (+${points} pts) - See how they matched same values?`;
  } else if (captureType === 'sum') {
    message = `${displayName} made a SUM! ${explanation} (+${points} pts) - Notice the math!`;
  } else {
    message = `${displayName} captured ${data.cardsCount || 0} cards! ${explanation} (+${points} pts)`;
  }

  this.showMessage(message, 'bot');
  this.currentTimeout = setTimeout(() => {
    this.handleGameEvent('TURN_START');
  }, 5000);
}

handleBotPlacementEducational(data) {
  const currentPlayer = this.getCurrentPlayer();
  const cardName = data.cardName || 'card';
  const reason = data.reason || '';
  const displayName = this.getBotDisplayName(currentPlayer);

  let message = `${displayName} placed ${cardName}`;
  if (reason) message += ` - ${reason}`;

  this.showMessage(message, 'bot');
  this.currentTimeout = setTimeout(() => {
    this.handleGameEvent('TURN_START');
  }, 3500);
}

// --- Error translation for beginners ---

translateErrorToGuidance(errorMessage) {
  if (errorMessage.includes('Base Card area')) {
    return "Put exactly ONE card in the Base Card area first! That's your target card.";
  }
  if (errorMessage.includes('hand + board')) {
    return "Your combo needs cards from BOTH your hand AND the board!";
  }
  if (errorMessage.includes("don't match")) {
    return "For pairs: all cards must have the same value. Check your base card value!";
  }
  if (errorMessage.includes('Face cards')) {
    return "Kings, Queens, Jacks can only make pairs, not sums!";
  }
  if (errorMessage.includes('sum')) {
    const combo = this.gameEngine.state.combination;
    if (combo.base.length > 0) {
      const baseValue = this.getCardNumericValue(combo.base[0].card);
      return `For sums: your cards must add up to ${baseValue}. Check your math!`;
    }
    return "For sums: make sure your cards add up to your base card's value.";
  }
  return "Something's not quite right with your combo. Try again!";
}

// --- Hint generation ---

generateSpecificHint() {
  const hand = this.gameEngine.state.hands[0] || [];
  const board = this.gameEngine.state.board || [];

  const pairOpportunities = this.findPairOpportunities(hand, board);
  if (pairOpportunities.length > 0) {
    const best = pairOpportunities[0];
    return `Easy pair available! You have ${best.handCard} and there's ${best.boardCard} on the board.`;
  }

  const sumOpportunities = this.findSimpleSumOpportunities(hand, board);
  if (sumOpportunities.length > 0) {
    const best = sumOpportunities[0];
    return `Sum combo available! ${best.handCard} + ${best.boardCard} = ${best.target}.`;
  }

  return "No captures available. Place your lowest value card on the board.";
}
*/
