/* 
 * 🎯 LEGENDARY HINT SYSTEM - Complete Rebuild
 * 🚀 FEATURES: Intelligent capture detection + Visual highlighting + Popup suggestions
 * 🎮 COACHING: Guides players through complex combo opportunities
 */

// 🎯 MAIN HINT SYSTEM CLASS
class HintSystem {
  constructor(gameEngine, uiSystem) {
    this.game = gameEngine;
    this.ui = uiSystem;
    this.suitSymbols = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
    this.currentHints = [];
    this.highlightedCards = [];
  }

  // 🔥 MASTER HINT ANALYZER - Find all possible captures
  analyzeAllPossibleCaptures() {
    if (this.game.state.currentPlayer !== 0) {
      return [];
    }

    const playerHand = this.game.state.hands[0];
    const board = this.game.state.board;
    const allCaptures = [];

    console.log(`🎯 ANALYZING HINTS: ${playerHand.length} hand cards vs ${board.length} board cards`);

    // Analyze each hand card for captures
    playerHand.forEach((handCard, handIndex) => {
      const captures = this.findCapturesForCard(handCard, handIndex, board);
      allCaptures.push(...captures);
    });

    // Sort by priority (multi-area > high value > simple)
    return this.prioritizeHints(allCaptures);
  }

  // 🧠 INTELLIGENT CAPTURE DETECTION for a single card
  findCapturesForCard(handCard, handIndex, board) {
    const captures = [];
    const handValue = this.getCardValue(handCard);
    const isFaceCard = ['J', 'Q', 'K'].includes(handCard.value);

    console.log(`🔍 ANALYZING: ${handCard.value}${this.suitSymbols[handCard.suit]} (value=${handValue})`);

    // 🎯 FIND PAIR CAPTURES (works with any card)
    board.forEach((boardCard, boardIndex) => {
      if (boardCard.value === handCard.value) {
        captures.push({
          type: 'pair',
          handCard: { card: handCard, index: handIndex },
          targetCards: [{ card: boardCard, index: boardIndex }],
          area: 'match', // Pairs go to match area
          score: this.calculateCaptureScore([handCard, boardCard]),
          description: `PAIR: ${handCard.value}${this.suitSymbols[handCard.suit]} matches ${boardCard.value}${this.suitSymbols[boardCard.suit]}`
        });
      }
    });

    // 🎯 FIND SUM CAPTURES (only for number cards and Aces)
    if (!isFaceCard && !isNaN(handValue)) {
      const sumCaptures = this.findSumCombinations(handCard, handIndex, board, handValue);
      captures.push(...sumCaptures);
    }

    return captures;
  }

  // 🧮 ADVANCED SUM COMBINATION FINDER
  findSumCombinations(handCard, handIndex, board, targetSum) {
    const sumCaptures = [];
    
    // Filter board to only numeric cards (no face cards in sums)
    const numericBoard = board.map((card, idx) => {
      const cardValue = this.getCardValue(card);
      return {
        card: card,
        index: idx,
        value: ['J', 'Q', 'K'].includes(card.value) ? null : cardValue
      };
    }).filter(item => item.value !== null);

    console.log(`🔍 SUM ANALYSIS: Target=${targetSum}, Numeric board cards=${numericBoard.length}`);

    // Single card sums
    numericBoard.forEach(boardItem => {
      if (boardItem.value === targetSum) {
        sumCaptures.push({
          type: 'sum',
          handCard: { card: handCard, index: handIndex },
          targetCards: [{ card: boardItem.card, index: boardItem.index }],
          area: 'sum1',
          score: this.calculateCaptureScore([handCard, boardItem.card]),
          description: `SUM: ${handCard.value}${this.suitSymbols[handCard.suit]} = ${boardItem.card.value}${this.suitSymbols[boardItem.card.suit]} (${targetSum})`
        });
      }
    });

    // Two-card sums
    for (let i = 0; i < numericBoard.length; i++) {
      for (let j = i + 1; j < numericBoard.length; j++) {
        const sum = numericBoard[i].value + numericBoard[j].value;
        if (sum === targetSum) {
          sumCaptures.push({
            type: 'sum',
            handCard: { card: handCard, index: handIndex },
            targetCards: [
              { card: numericBoard[i].card, index: numericBoard[i].index },
              { card: numericBoard[j].card, index: numericBoard[j].index }
            ],
            area: 'sum2',
            score: this.calculateCaptureScore([handCard, numericBoard[i].card, numericBoard[j].card]),
            description: `SUM: ${handCard.value}${this.suitSymbols[handCard.suit]} = ${numericBoard[i].card.value}${this.suitSymbols[numericBoard[i].card.suit]} + ${numericBoard[j].card.value}${this.suitSymbols[numericBoard[j].card.suit]} (${numericBoard[i].value}+${numericBoard[j].value}=${targetSum})`
          });
        }
      }
    }

    // Three-card sums
    for (let i = 0; i < numericBoard.length; i++) {
      for (let j = i + 1; j < numericBoard.length; j++) {
        for (let k = j + 1; k < numericBoard.length; k++) {
          const sum = numericBoard[i].value + numericBoard[j].value + numericBoard[k].value;
          if (sum === targetSum) {
            sumCaptures.push({
              type: 'sum',
              handCard: { card: handCard, index: handIndex },
              targetCards: [
                { card: numericBoard[i].card, index: numericBoard[i].index },
                { card: numericBoard[j].card, index: numericBoard[j].index },
                { card: numericBoard[k].card, index: numericBoard[k].index }
              ],
              area: 'sum3',
              score: this.calculateCaptureScore([handCard, numericBoard[i].card, numericBoard[j].card, numericBoard[k].card]),
              description: `SUM: ${handCard.value}${this.suitSymbols[handCard.suit]} = ${numericBoard[i].card.value}${this.suitSymbols[numericBoard[i].card.suit]} + ${numericBoard[j].card.value}${this.suitSymbols[numericBoard[j].card.suit]} + ${numericBoard[k].card.value}${this.suitSymbols[numericBoard[k].card.suit]} (${sum}=${targetSum})`
            });
          }
        }
      }
    }

    return sumCaptures;
  }

  // 🏆 HINT PRIORITIZATION SYSTEM
  prioritizeHints(captures) {
    if (captures.length === 0) return [];

    return captures.sort((a, b) => {
      // Priority 1: Higher scores first
      if (a.score !== b.score) return b.score - a.score;
      
      // Priority 2: Multi-card captures (more complex = better)
      const aComplexity = a.targetCards.length;
      const bComplexity = b.targetCards.length;
      if (aComplexity !== bComplexity) return bComplexity - aComplexity;
      
      // Priority 3: Pairs over sums (easier to see)
      if (a.type !== b.type) {
        return a.type === 'pair' ? -1 : 1;
      }
      
      return 0;
    });
  }

  // 💰 CALCULATE CAPTURE SCORE
  calculateCaptureScore(cards) {
    const pointsMap = {
      'A': 15, 'K': 10, 'Q': 10, 'J': 10, '10': 10,
      '9': 5, '8': 5, '7': 5, '6': 5, '5': 5, '4': 5, '3': 5, '2': 5
    };
    return cards.reduce((total, card) => total + (pointsMap[card.value] || 0), 0);
  }

  // 🎮 GET CARD NUMERIC VALUE
  getCardValue(card) {
    if (card.value === 'A') return 1;
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    return parseInt(card.value) || 0;
  }

  // 🎯 MAIN HINT DISPLAY FUNCTION
  showHint() {
    console.log(`🎯 HINT REQUESTED!`);
    
    // Clear any existing hints
    this.clearHints();
    
    // Find all possible captures
    const captures = this.analyzeAllPossibleCaptures();
    
    if (captures.length === 0) {
      this.showNoHintsMessage();
      return;
    }

    // Get the best hint
    const bestHint = captures[0];
    console.log(`🏆 BEST HINT: ${bestHint.description} (${bestHint.score} pts)`);
    
    // Show the hint
    this.displayHintPopup(bestHint);
    this.highlightHintCards(bestHint);
    
    // Store current hints for cleanup
    this.currentHints = [bestHint];
  }

  // 🎪 DISPLAY HINT POPUP
  displayHintPopup(hint) {
    // Remove any existing hint popup
    const existingPopup = document.getElementById('hint-popup');
    if (existingPopup) {
      existingPopup.remove();
    }

    // Create new popup
    const popup = document.createElement('div');
    popup.id = 'hint-popup';
    popup.className = 'hint-popup';
    
    // Build hint content
    const handCardName = `${hint.handCard.card.value}${this.suitSymbols[hint.handCard.card.suit]}`;
    const targetNames = hint.targetCards.map(tc => 
      `${tc.card.value}${this.suitSymbols[tc.card.suit]}`
    ).join(' + ');
    
    let suggestionText = '';
    if (hint.type === 'pair') {
      suggestionText = `🎯 <strong>PAIR CAPTURE!</strong><br>
                       Use <span class="highlight-card">${handCardName}</span> to capture <span class="highlight-card">${targetNames}</span><br>
                       <small>• Place both in Match area • Worth ${hint.score} points!</small>`;
    } else {
      suggestionText = `🧮 <strong>SUM CAPTURE!</strong><br>
                       Use <span class="highlight-card">${handCardName}</span> as base, capture <span class="highlight-card">${targetNames}</span><br>
                       <small>• Place base in Base area, targets in ${hint.area.charAt(0).toUpperCase() + hint.area.slice(1)} area • Worth ${hint.score} points!</small>`;
    }
    
    popup.innerHTML = `
      <div class="hint-content">
        <div class="hint-header">💡 SMART HINT</div>
        <div class="hint-suggestion">${suggestionText}</div>
        <button class="hint-close" onclick="window.hintSystem.clearHints()">Got it! ✓</button>
      </div>
    `;
    
    // Position popup
    const gameArea = document.querySelector('.table') || document.body;
    gameArea.appendChild(popup);
    
    // Animate in
    setTimeout(() => popup.classList.add('show'), 50);
    
    // Auto-hide after 8 seconds
    setTimeout(() => this.clearHints(), 8000);
  }

  // ✨ HIGHLIGHT HINT CARDS with glow effect
  highlightHintCards(hint) {
    const highlightedElements = [];
    
    // Highlight hand card
    const handCards = document.querySelectorAll('#player-hand .card');
    if (handCards[hint.handCard.index]) {
      handCards[hint.handCard.index].classList.add('hint-glow', 'hint-hand-card');
      highlightedElements.push(handCards[hint.handCard.index]);
    }
    
    // Highlight target cards on board
    hint.targetCards.forEach(target => {
      const boardCards = document.querySelectorAll('#board .card');
      if (boardCards[target.index]) {
        boardCards[target.index].classList.add('hint-glow', 'hint-target-card');
        highlightedElements.push(boardCards[target.index]);
      }
    });
    
    this.highlightedCards = highlightedElements;
    console.log(`✨ HIGHLIGHTED: ${highlightedElements.length} cards`);
  }

  // 🚫 NO HINTS AVAILABLE MESSAGE
  showNoHintsMessage() {
    const popup = document.createElement('div');
    popup.id = 'hint-popup';
    popup.className = 'hint-popup';
    
    popup.innerHTML = `
      <div class="hint-content">
        <div class="hint-header">🤔 NO CAPTURES AVAILABLE</div>
        <div class="hint-suggestion">
          <strong>Try placing a card to end your turn!</strong><br>
          <small>• Drag a card from your hand to the board</small><br>
          <small>• Look for strategic placements</small>
        </div>
        <button class="hint-close" onclick="window.hintSystem.clearHints()">Understood ✓</button>
      </div>
    `;
    
    const gameArea = document.querySelector('.table') || document.body;
    gameArea.appendChild(popup);
    
    setTimeout(() => popup.classList.add('show'), 50);
    setTimeout(() => this.clearHints(), 5000);
  }

  // 🧹 CLEAR ALL HINTS
  clearHints() {
    // Remove popup
    const popup = document.getElementById('hint-popup');
    if (popup) {
      popup.classList.remove('show');
      setTimeout(() => popup.remove(), 300);
    }
    
    // Remove card highlights
    this.highlightedCards.forEach(card => {
      card.classList.remove('hint-glow', 'hint-hand-card', 'hint-target-card');
    });
    
    this.highlightedCards = [];
    this.currentHints = [];
    
    console.log(`🧹 HINTS CLEARED`);
  }

  // 🔧 DEBUG: Show all possible captures
  debugAllCaptures() {
    const captures = this.analyzeAllPossibleCaptures();
    console.log(`🔍 DEBUG: Found ${captures.length} possible captures:`);
    captures.forEach((capture, index) => {
      console.log(`${index + 1}. ${capture.description} (${capture.score} pts)`);
    });
    return captures;
  }
}

// 🎯 ENHANCED HINT FUNCTION - Replace the one in main.js
function provideHint() {
  if (game.state.currentPlayer !== 0) {
    console.log('🚫 HINT: Not player turn');
    return;
  }
  
  // Initialize hint system if not exists
  if (!window.hintSystem) {
    window.hintSystem = new HintSystem(game, ui);
  }
  
  // Show intelligent hint
  window.hintSystem.showHint();
}

// Make hint system globally available
window.HintSystem = HintSystem;
window.provideHint = provideHint;