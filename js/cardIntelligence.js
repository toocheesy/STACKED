/* 
 * 🧠 LEGENDARY CARD INTELLIGENCE SYSTEM
 * The AI brain that tracks, predicts, and strategizes
 * Makes bots feel like genius human players!
 * 🔥 FIXED: Removed duplicate round tracking
 */

class CardIntelligenceSystem {
  constructor() {
    // 🔥 FIX: Define constants BEFORE calling reset()
    this.CARD_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    this.TOTAL_CARDS_PER_VALUE = 4; // 4 suits per value
    
    this.reset();
    
    console.log('🧠 CARD INTELLIGENCE SYSTEM INITIALIZED - AI BRAIN ONLINE!');
  }
  
  reset() {
    // Track what cards have been played/seen
    this.playedCards = {};
    if (this.CARD_VALUES) {
      this.CARD_VALUES.forEach(value => {
        this.playedCards[value] = 0;
      });
    }
    
    // Game state tracking - 🔥 REMOVED: roundNumber (GameEngine tracks this)
    this.totalCardsDealt = 0;
    this.gamePhase = 'early'; // early, mid, late, endgame
  }
  
  // 🎯 CORE: Update card tracking when cards are played
  updateCardsSeen(cards) {
    cards.forEach(card => {
      if (this.playedCards[card.value] !== undefined) {
        this.playedCards[card.value]++;
        this.totalCardsDealt++;
      }
    });
    
    this.updateGamePhase();
    console.log(`🔍 CARDS TRACKED: ${cards.length} new cards, Total seen: ${this.totalCardsDealt}`);
  }
  
  // 📊 Calculate how many cards of each value are still "out there"
  getRemainingCards(value) {
    const seen = this.playedCards[value] || 0;
    const remaining = Math.max(0, this.TOTAL_CARDS_PER_VALUE - seen);
    return remaining;
  }
  
  // 🎯 STRATEGIC: Calculate capture risk when placing a card
  calculateCaptureRisk(cardToPlace, currentBoard, playerIndex = 1) {
    let totalRisk = 0;
    let riskFactors = [];
    
    console.log(`🎯 RISK ANALYSIS: Placing ${cardToPlace.value} with ${currentBoard.length} board cards`);
    
    // Check each board card for potential combo risks
    for (const boardCard of currentBoard) {
      const risks = this.analyzeCombinationRisks(cardToPlace, boardCard);
      totalRisk += risks.riskScore;
      if (risks.riskScore > 0) {
        riskFactors.push(risks);
      }
    }
    
    // Adjust risk based on game phase
    const phaseMultiplier = this.getPhaseRiskMultiplier();
    totalRisk *= phaseMultiplier;
    
    console.log(`🎯 TOTAL RISK: ${totalRisk.toFixed(1)}% (Phase: ${this.gamePhase})`);
    
    return {
      riskScore: Math.min(100, totalRisk),
      riskFactors: riskFactors,
      gamePhase: this.gamePhase,
      recommendation: this.getRiskRecommendation(totalRisk)
    };
  }
  
  // 🔍 Analyze specific combination risks between two cards
  analyzeCombinationRisks(cardToPlace, boardCard) {
    const risks = { riskScore: 0, reasons: [] };
    
    // PAIR RISK: Placing same value as board card
    if (cardToPlace.value === boardCard.value) {
      const remaining = this.getRemainingCards(cardToPlace.value);
      const pairRisk = Math.max(20, remaining * 15); // Higher risk if more remaining
      risks.riskScore += pairRisk;
      risks.reasons.push(`PAIR RISK: ${remaining} more ${cardToPlace.value}s available (${pairRisk}%)`);
    }
    
    // SUM RISK: Check if these cards could form sum combinations
    const sumRisks = this.calculateSumRisks(cardToPlace, boardCard);
    risks.riskScore += sumRisks.riskScore;
    risks.reasons.push(...sumRisks.reasons);
    
    return risks;
  }
  
  // 🧮 Calculate sum combination risks
  calculateSumRisks(cardToPlace, boardCard) {
    const risks = { riskScore: 0, reasons: [] };
    
    // Only analyze if both are number cards (not face cards)
    const placeValue = this.getNumericValue(cardToPlace.value);
    const boardValue = this.getNumericValue(boardCard.value);
    
    if (placeValue === null || boardValue === null) {
      return risks; // Skip face cards
    }
    
    // Check what sum values could capture this combination
    const targetSum = placeValue + boardValue;
    
    if (targetSum <= 10) { // Only realistic sums
      const remaining = this.getRemainingCards(targetSum.toString());
      if (remaining > 0) {
        const sumRisk = remaining * 8; // Risk per remaining card
        risks.riskScore += sumRisk;
        risks.reasons.push(`SUM RISK: ${placeValue}+${boardValue}=${targetSum}, ${remaining} cards can capture (${sumRisk}%)`);
      }
    }
    
    return risks;
  }
  
  // 🎯 STRATEGIC: Find best capture from available options
  findBestCapture(handCards, boardCards, personality = 'calculator') {
    // 🔥 SAFETY CHECK: Don't try to capture if hand is empty
    if (!handCards || handCards.length === 0) {
      console.log('🚨 AI SAFETY: No cards in hand for captures');
      return null;
    }
    
    const allCaptures = [];
    
    // Find all possible captures
    for (let i = 0; i < handCards.length; i++) {
      const handCard = handCards[i];
      const captures = canCapture(handCard, boardCards); // Use existing function
      
      if (captures && captures.length > 0) {
        for (const capture of captures) {
          const evaluation = this.evaluateCapture(handCard, capture, personality);
          allCaptures.push({
            handIndex: i,
            handCard: handCard,
            capture: capture,
            evaluation: evaluation
          });
        }
      }
    }
    
    if (allCaptures.length === 0) {
      return null;
    }
    
    // Sort by evaluation score (best first)
    allCaptures.sort((a, b) => b.evaluation.totalScore - a.evaluation.totalScore);
    
    const bestCapture = allCaptures[0];
    console.log(`🎯 BEST CAPTURE: ${bestCapture.handCard.value} → ${bestCapture.evaluation.totalScore} pts (${bestCapture.evaluation.reasoning})`);
    
    return bestCapture;
  }
  
  // 📊 Evaluate a specific capture opportunity
  evaluateCapture(handCard, capture, personality = 'calculator') {
    let score = 0;
    let reasoning = [];
    
    // Base points from captured cards
    const basePoints = this.calculateCapturePoints(handCard, capture);
    score += basePoints;
    reasoning.push(`Base: ${basePoints}pts`);
    
    // Strategic bonuses based on personality
    if (personality === 'calculator') {
      // Pure point maximization
      score += capture.targets?.length * 2 || 0; // Bonus for multi-card captures
      reasoning.push('Calculator: Multi-card bonus');
    } else if (personality === 'strategist') {
      // Board control considerations
      const controlBonus = this.calculateBoardControlBonus(capture);
      score += controlBonus;
      reasoning.push(`Strategist: Control +${controlBonus}`);
    } else if (personality === 'adaptive') {
      // Context-based scoring
      const adaptiveBonus = this.calculateAdaptiveBonus(capture);
      score += adaptiveBonus;
      reasoning.push(`Adaptive: Context +${adaptiveBonus}`);
    }
    
    return {
      totalScore: score,
      basePoints: basePoints,
      reasoning: reasoning.join(', ')
    };
  }
  
  // 🎯 STRATEGIC: Find safest card to place when no captures available
  findSafestCardToPlace(handCards, boardCards, personality = 'calculator') {
    // 🔥 CRITICAL SAFETY CHECK: Don't try to place cards if hand is empty!
    if (!handCards || handCards.length === 0) {
      console.log('🚨 AI SAFETY: No cards in hand to place');
      return null;
    }
    
    const placements = [];
    
    for (let i = 0; i < handCards.length; i++) {
      const handCard = handCards[i];
      
      // 🔥 ADDITIONAL SAFETY: Make sure the card exists
      if (!handCard) {
        console.log(`🚨 AI SAFETY: Invalid card at index ${i}`);
        continue;
      }
      
      const riskAnalysis = this.calculateCaptureRisk(handCard, boardCards);
      const valueScore = this.getCardStrategicValue(handCard);
      
      // Calculate placement desirability (lower risk + lower value = better)
      const placementScore = (100 - riskAnalysis.riskScore) + (50 - valueScore);
      
      placements.push({
        handIndex: i,
        handCard: handCard,
        riskAnalysis: riskAnalysis,
        valueScore: valueScore,
        placementScore: placementScore
      });
    }
    
    // 🔥 SAFETY CHECK: Make sure we have valid placements
    if (placements.length === 0) {
      console.log('🚨 AI SAFETY: No valid placements found');
      return null;
    }
    
    // Sort by placement score (safest first)
    placements.sort((a, b) => b.placementScore - a.placementScore);
    
    const safestPlacement = placements[0];
    console.log(`🛡️ SAFEST PLACEMENT: ${safestPlacement.handCard.value} (Risk: ${safestPlacement.riskAnalysis.riskScore.toFixed(1)}%, Value: ${safestPlacement.valueScore})`);
    
    return safestPlacement;
  }
  
  // 💎 Calculate strategic value of holding vs playing a card
  getCardStrategicValue(card) {
    const pointValue = this.getCardPointValue(card);
    let strategicValue = pointValue;
    
    // Face cards are extra valuable (can only pair, not sum)
    if (['J', 'Q', 'K'].includes(card.value)) {
      strategicValue += 15; // Hold face cards longer
    }
    
    // Aces are EXTREMELY valuable
    if (card.value === 'A') {
      strategicValue += 25; // Almost never place Aces
    }
    
    // Low number cards are safer to place
    const numValue = this.getNumericValue(card.value);
    if (numValue && numValue <= 4) {
      strategicValue -= 10; // Low cards safer to place
    }
    
    return strategicValue;
  }
  
  // 🎮 Update game phase based on cards played
  updateGamePhase() {
    const totalCards = 52;
    const playedPercentage = (this.totalCardsDealt / totalCards) * 100;
    
    if (playedPercentage < 25) {
      this.gamePhase = 'early';
    } else if (playedPercentage < 50) {
      this.gamePhase = 'mid';
    } else if (playedPercentage < 75) {
      this.gamePhase = 'late';
    } else {
      this.gamePhase = 'endgame';
    }
  }
  
  // 🎯 HELPER FUNCTIONS
  getNumericValue(cardValue) {
    if (cardValue === 'A') return 1;
    const num = parseInt(cardValue);
    return isNaN(num) ? null : num; // null for face cards
  }
  
  getCardPointValue(card) {
    const pointsMap = {
      'A': 15, 'K': 10, 'Q': 10, 'J': 10, '10': 10,
      '9': 5, '8': 5, '7': 5, '6': 5, '5': 5, '4': 5, '3': 5, '2': 5
    };
    return pointsMap[card.value] || 0;
  }
  
  calculateCapturePoints(handCard, capture) {
    const allCards = [handCard, ...(capture.targets || [])];
    return allCards.reduce((total, card) => total + this.getCardPointValue(card), 0);
  }
  
  calculateBoardControlBonus(capture) {
    // Bonus for clearing dangerous board combinations
    return (capture.targets?.length || 0) * 3;
  }
  
  calculateAdaptiveBonus(capture) {
    // Context-based bonus (implement based on game state)
    if (this.gamePhase === 'endgame') {
      return 10; // More aggressive in endgame
    }
    return 0;
  }
  
  getPhaseRiskMultiplier() {
    const multipliers = {
      'early': 0.8,   // Less risky early game
      'mid': 1.0,     // Standard risk
      'late': 1.3,    // More careful late game
      'endgame': 1.6  // Very careful in endgame
    };
    return multipliers[this.gamePhase] || 1.0;
  }
  
  getRiskRecommendation(riskScore) {
    if (riskScore < 20) return 'SAFE';
    if (riskScore < 40) return 'MODERATE';
    if (riskScore < 70) return 'RISKY';
    return 'DANGEROUS';
  }
  
  // 🔍 Debug function to see AI's current knowledge
  debugCardKnowledge() {
    console.log('🧠 AI CARD KNOWLEDGE:');
    this.CARD_VALUES.forEach(value => {
      const seen = this.playedCards[value];
      const remaining = this.getRemainingCards(value);
      console.log(`   ${value}: ${seen} seen, ${remaining} remaining`);
    });
    console.log(`   Game Phase: ${this.gamePhase} (${this.totalCardsDealt} cards played)`);
  }
}

// 🎯 GLOBAL CARD INTELLIGENCE INSTANCE
window.cardIntelligence = new CardIntelligenceSystem();

// Export for other files
window.CardIntelligenceSystem = CardIntelligenceSystem;