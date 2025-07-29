/* 
 * 🤖 STACKED! AI SYSTEM - CONSOLIDATED POWERHOUSE
 * Professional-grade AI system with clean public API
 * Consolidates: ai.js + cardIntelligence.js + botModal.js → aiSystem.js
 * 🔥 EPIC FEATURES: Strategic analysis, educational modes, bot execution
 */

// ============================================================================
// 🧠 CARD INTELLIGENCE ENGINE
// ============================================================================

class CardIntelligenceEngine {
  constructor() {
    // Card tracking constants
    this.CARD_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    this.TOTAL_CARDS_PER_VALUE = 4; // 4 suits per value
    
    this.reset();
    console.log('🧠 CARD INTELLIGENCE ENGINE INITIALIZED!');
  }
  
  reset() {
    // Track what cards have been played/seen
    this.playedCards = {};
    this.CARD_VALUES.forEach(value => {
      this.playedCards[value] = 0;
    });
    
    // Game state tracking
    this.totalCardsDealt = 0;
    this.gamePhase = 'early'; // early, mid, late, endgame
  }
  
  // 🎯 UPDATE CARD TRACKING
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
  
  // 📊 CALCULATE REMAINING CARDS
  getRemainingCards(value) {
    const seen = this.playedCards[value] || 0;
    return Math.max(0, this.TOTAL_CARDS_PER_VALUE - seen);
  }
  
  // 🎯 STRATEGIC CAPTURE ANALYSIS - ENHANCED WITH MEGA-CAPTURE DETECTION
findBestCapture(handCards, boardCards, personality = 'calculator') {
  if (!handCards || handCards.length === 0) {
    console.log('🚨 AI SAFETY: No cards in hand for captures');
    return null;
  }
  
  const allCaptures = [];
  
  // PHASE 1: Find traditional single-area captures (EXISTING LOGIC)
  for (let i = 0; i < handCards.length; i++) {
    const handCard = handCards[i];
    const captures = canCapture(handCard, boardCards);
    
    if (captures && captures.length > 0) {
      for (const capture of captures) {
        const evaluation = this.evaluateCapture(handCard, capture, personality);
        allCaptures.push({
          handIndex: i,
          handCard: handCard,
          capture: capture,
          evaluation: evaluation,
          type: 'single-area'
        });
      }
    }
  }
  
  // 🔥 PHASE 2: Find MEGA multi-area captures (NEW MEGA-CAPTURE LOGIC!)
  const megaCaptures = this.findMegaCaptures(handCards, boardCards, personality);
  allCaptures.push(...megaCaptures);
  
  if (allCaptures.length === 0) {
    return null;
  }
  
  // Sort by evaluation score (best first)
  allCaptures.sort((a, b) => b.evaluation.totalScore - a.evaluation.totalScore);
  
  const bestCapture = allCaptures[0];
  
  // 🎉 EPIC LOGGING for mega-captures
  if (bestCapture.type === 'mega-capture' && bestCapture.evaluation.totalCards >= 4) {
    console.log(`🚀 MEGA-CAPTURE DETECTED! ${bestCapture.evaluation.totalCards} cards for ${bestCapture.evaluation.totalScore} pts!`);
    console.log(`   Areas used: ${bestCapture.evaluation.areasUsed.join(', ')}`);
    console.log(`   🤯 MIND-BLOWING: ${bestCapture.evaluation.reasoning}`);
  } else {
    console.log(`🎯 BEST CAPTURE: ${bestCapture.handCard.value} → ${bestCapture.evaluation.totalScore} pts (${bestCapture.evaluation.reasoning})`);
  }
  
  return bestCapture;
}

// 🔥 FIXED MEGA-CAPTURE SYSTEM - REPLACE ALL 5 FUNCTIONS

// 🔥 NEW FUNCTION: MEGA-CAPTURE DETECTION ENGINE (FIXED)
findMegaCaptures(handCards, boardCards, personality) {
  const megaCaptures = [];
  
  // Try each hand card as a potential base
  for (let handIdx = 0; handIdx < handCards.length; handIdx++) {
    const handCard = handCards[handIdx];
    
    // Skip face cards as base (they can only make pairs)
    const numericValue = this.getNumericValue(handCard.value);
    if (numericValue === null && handCard.value !== 'A') continue;
    
    // Find all possible multi-area combinations using this base
    const megaCombos = this.findValidMegaCombinations(handCard, handCards, boardCards, handIdx);
    
    // Evaluate each mega-combination
    for (const combo of megaCombos) {
      const evaluation = this.evaluateMegaCapture(combo, personality);
      
      // Only keep truly spectacular captures (4+ cards)
      if (evaluation.totalCards >= 4) {
        // Convert to format expected by bot executor
        const captureTargets = [];
        ['sum1', 'sum2', 'sum3', 'match'].forEach(area => {
          if (combo.areas[area] && combo.areas[area].length > 0) {
            combo.areas[area].forEach(cardItem => {
              if (cardItem.source === 'board') {
                captureTargets.push(cardItem.card);
              }
            });
          }
        });
        
        megaCaptures.push({
          handIndex: handIdx,
          handCard: handCard,
          capture: {
            type: 'mega',
            targets: captureTargets
          },
          evaluation: evaluation,
          type: 'mega-capture'
        });
      }
    }
  }
  
  console.log(`🔥 MEGA-CAPTURE SCAN: Found ${megaCaptures.length} valid combinations!`);
  return megaCaptures;
}

// 🧠 FIND VALID MEGA-COMBINATIONS (COMPLETELY REWRITTEN)
// 🧠 FIND VALID MEGA-COMBINATIONS (COMPLETELY REWRITTEN WITH CORRECT LOGIC)
findValidMegaCombinations(baseCard, handCards, boardCards, baseHandIdx) {
  const combinations = [];
  const baseValue = baseCard.value;
  const baseNumValue = this.getNumericValue(baseValue);
  
  // Determine if base card is from hand or board
  const baseIsFromHand = baseHandIdx !== -1; // -1 means board card
  
  console.log(`🔍 MEGA SCAN: Base ${baseValue} (numeric: ${baseNumValue}) from ${baseIsFromHand ? 'hand' : 'board'}`);
  
  // Get available cards (excluding base card if from hand)
  const availableHandCards = baseIsFromHand ? 
    handCards.filter((card, idx) => idx !== baseHandIdx) : 
    [...handCards];
  const availableBoardCards = baseIsFromHand ? 
    [...boardCards] : 
    boardCards.filter(card => card.id !== baseCard.id);
  
  // For face cards, only look for matches
  if (baseNumValue === null && baseValue !== 'A') {
    let matchingCards = [];
    
    if (baseIsFromHand) {
      // Base from hand, need board cards for match
      matchingCards = availableBoardCards.filter(card => card.value === baseValue);
    } else {
      // Base from board, need hand cards for match
      matchingCards = availableHandCards.filter(card => card.value === baseValue);
    }
    
    if (matchingCards.length > 0) {
      combinations.push({
        base: baseCard,
        baseSource: baseIsFromHand ? 'hand' : 'board',
        areas: {
          match: matchingCards.map(card => ({ 
            card, 
            source: baseIsFromHand ? 'board' : 'hand' 
          })),
          sum1: [], sum2: [], sum3: []
        },
        totalCards: 1 + matchingCards.length
      });
    }
    return combinations;
  }
  
  // For number cards and Aces: Find sum combinations + matches
  const targetValue = baseValue === 'A' ? 1 : baseNumValue;
  
  // Find valid sum combinations based on base card source
  const validSumAreas = this.findValidSumAreas(
    availableHandCards, 
    availableBoardCards, 
    targetValue, 
    baseIsFromHand
  );
  
  // Find matching cards (opposite source from base)
  let matchingCards = [];
  if (baseIsFromHand) {
    matchingCards = availableBoardCards.filter(card => card.value === baseValue);
  } else {
    matchingCards = availableHandCards.filter(card => card.value === baseValue);
  }
  
  // Generate combinations using 1-3 sum areas + optional matches
  for (let numAreas = 1; numAreas <= Math.min(3, validSumAreas.length); numAreas++) {
    const areaCombos = this.getCombinations(validSumAreas, numAreas);
    
    for (const areaCombo of areaCombos) {
      // Check for card conflicts
      const usedCards = new Set();
      let hasConflict = false;
      
      const areas = { sum1: [], sum2: [], sum3: [], match: [] };
      
      // Assign sum areas
      areaCombo.forEach((area, index) => {
        const areaName = `sum${index + 1}`;
        areas[areaName] = area;
        
        area.forEach(cardItem => {
          const cardKey = `${cardItem.source}-${cardItem.card.id || cardItem.card.value + cardItem.card.suit}`;
          if (usedCards.has(cardKey)) {
            hasConflict = true;
          }
          usedCards.add(cardKey);
        });
      });
      
      if (hasConflict) continue;
      
      // Add matches if available and no conflicts
      if (matchingCards.length > 0) {
        const availableMatches = matchingCards.filter(card => {
          const cardKey = `${baseIsFromHand ? 'board' : 'hand'}-${card.id || card.value + card.suit}`;
          return !usedCards.has(cardKey);
        });
        
        if (availableMatches.length > 0) {
          areas.match = availableMatches.map(card => ({ 
            card, 
            source: baseIsFromHand ? 'board' : 'hand' 
          }));
        }
      }
      
      // Calculate total cards
      const totalCards = 1 + Object.values(areas).reduce((sum, area) => sum + area.length, 0);
      
      if (totalCards >= 4) { // Only keep truly mega captures
        combinations.push({
          base: baseCard,
          baseSource: baseIsFromHand ? 'hand' : 'board',
          areas: areas,
          totalCards: totalCards
        });
      }
    }
  }
  
  return combinations;
}

// 🧮 FIND VALID SUM AREAS (CORRECTED LOGIC)
findValidSumAreas(handCards, boardCards, targetValue, baseIsFromHand) {
  const validAreas = [];
  
  // Filter to only number cards
  const numberHandCards = handCards.filter(card => {
    const numValue = this.getNumericValue(card.value);
    return numValue !== null;
  });
  
  const numberBoardCards = boardCards.filter(card => {
    const numValue = this.getNumericValue(card.value);
    return numValue !== null;
  });
  
  console.log(`🔍 SUM AREAS: Base from ${baseIsFromHand ? 'hand' : 'board'}, need ${baseIsFromHand ? 'board' : 'hand'} cards in areas`);
  
  if (baseIsFromHand) {
    // Base from hand - each sum area must have at least 1 board card
    
    // 1. Board-only combinations
    for (let i = 0; i < numberBoardCards.length; i++) {
      const boardCard1 = numberBoardCards[i];
      const value1 = this.getNumericValue(boardCard1.value);
      
      // Single board card
      if (value1 === targetValue) {
        validAreas.push([{ card: boardCard1, source: 'board' }]);
      }
      
      // Two board cards
      for (let j = i + 1; j < numberBoardCards.length; j++) {
        const boardCard2 = numberBoardCards[j];
        const value2 = this.getNumericValue(boardCard2.value);
        
        if (value1 + value2 === targetValue) {
          validAreas.push([
            { card: boardCard1, source: 'board' },
            { card: boardCard2, source: 'board' }
          ]);
        }
        
        // Three board cards
        for (let k = j + 1; k < numberBoardCards.length; k++) {
          const boardCard3 = numberBoardCards[k];
          const value3 = this.getNumericValue(boardCard3.value);
          
          if (value1 + value2 + value3 === targetValue) {
            validAreas.push([
              { card: boardCard1, source: 'board' },
              { card: boardCard2, source: 'board' },
              { card: boardCard3, source: 'board' }
            ]);
          }
        }
      }
    }
    
    // 2. Mixed combinations (board + hand, but must have at least 1 board)
    for (let i = 0; i < numberBoardCards.length; i++) {
      const boardCard = numberBoardCards[i];
      const boardValue = this.getNumericValue(boardCard.value);
      
      for (let j = 0; j < numberHandCards.length; j++) {
        const handCard = numberHandCards[j];
        const handValue = this.getNumericValue(handCard.value);
        
        // Board + hand combination
        if (boardValue + handValue === targetValue) {
          validAreas.push([
            { card: boardCard, source: 'board' },
            { card: handCard, source: 'hand' }
          ]);
        }
        
        // Board + hand + hand combination
        for (let k = j + 1; k < numberHandCards.length; k++) {
          const handCard2 = numberHandCards[k];
          const handValue2 = this.getNumericValue(handCard2.value);
          
          if (boardValue + handValue + handValue2 === targetValue) {
            validAreas.push([
              { card: boardCard, source: 'board' },
              { card: handCard, source: 'hand' },
              { card: handCard2, source: 'hand' }
            ]);
          }
        }
        
        // Board + board + hand combination
        for (let k = i + 1; k < numberBoardCards.length; k++) {
          const boardCard2 = numberBoardCards[k];
          const boardValue2 = this.getNumericValue(boardCard2.value);
          
          if (boardValue + boardValue2 + handValue === targetValue) {
            validAreas.push([
              { card: boardCard, source: 'board' },
              { card: boardCard2, source: 'board' },
              { card: handCard, source: 'hand' }
            ]);
          }
        }
      }
    }
    
  } else {
    // Base from board - each sum area must have at least 1 hand card
    
    // 1. Hand-only combinations
    for (let i = 0; i < numberHandCards.length; i++) {
      const handCard1 = numberHandCards[i];
      const value1 = this.getNumericValue(handCard1.value);
      
      // Single hand card
      if (value1 === targetValue) {
        validAreas.push([{ card: handCard1, source: 'hand' }]);
      }
      
      // Two hand cards
      for (let j = i + 1; j < numberHandCards.length; j++) {
        const handCard2 = numberHandCards[j];
        const value2 = this.getNumericValue(handCard2.value);
        
        if (value1 + value2 === targetValue) {
          validAreas.push([
            { card: handCard1, source: 'hand' },
            { card: handCard2, source: 'hand' }
          ]);
        }
        
        // Three hand cards
        for (let k = j + 1; k < numberHandCards.length; k++) {
          const handCard3 = numberHandCards[k];
          const value3 = this.getNumericValue(handCard3.value);
          
          if (value1 + value2 + value3 === targetValue) {
            validAreas.push([
              { card: handCard1, source: 'hand' },
              { card: handCard2, source: 'hand' },
              { card: handCard3, source: 'hand' }
            ]);
          }
        }
      }
    }
    
    // 2. Mixed combinations (hand + board, but must have at least 1 hand)
    for (let i = 0; i < numberHandCards.length; i++) {
      const handCard = numberHandCards[i];
      const handValue = this.getNumericValue(handCard.value);
      
      for (let j = 0; j < numberBoardCards.length; j++) {
        const boardCard = numberBoardCards[j];
        const boardValue = this.getNumericValue(boardCard.value);
        
        // Hand + board combination
        if (handValue + boardValue === targetValue) {
          validAreas.push([
            { card: handCard, source: 'hand' },
            { card: boardCard, source: 'board' }
          ]);
        }
        
        // Hand + hand + board combination
        for (let k = i + 1; k < numberHandCards.length; k++) {
          const handCard2 = numberHandCards[k];
          const handValue2 = this.getNumericValue(handCard2.value);
          
          if (handValue + handValue2 + boardValue === targetValue) {
            validAreas.push([
              { card: handCard, source: 'hand' },
              { card: handCard2, source: 'hand' },
              { card: boardCard, source: 'board' }
            ]);
          }
        }
        
        // Hand + board + board combination
        for (let k = j + 1; k < numberBoardCards.length; k++) {
          const boardCard2 = numberBoardCards[k];
          const boardValue2 = this.getNumericValue(boardCard2.value);
          
          if (handValue + boardValue + boardValue2 === targetValue) {
            validAreas.push([
              { card: handCard, source: 'hand' },
              { card: boardCard, source: 'board' },
              { card: boardCard2, source: 'board' }
            ]);
          }
        }
      }
    }
  }
  
  console.log(`🧮 FOUND ${validAreas.length} valid sum combinations for target ${targetValue}`);
  return validAreas;
}

// 🎯 EVALUATE MEGA-CAPTURE (FIXED SCORING)
evaluateMegaCapture(combo, personality) {
  let score = 0;
  let reasoning = [];
  const areasUsed = [];
  
  // Base card points
  const basePoints = this.getCardPointValue(combo.base);
  score += basePoints;
  reasoning.push(`Base: ${basePoints}pts`);
  
  // Points from each area
  ['sum1', 'sum2', 'sum3', 'match'].forEach(area => {
    if (combo.areas[area] && combo.areas[area].length > 0) {
      areasUsed.push(area);
      const areaPoints = combo.areas[area].reduce((sum, item) => sum + this.getCardPointValue(item.card), 0);
      score += areaPoints;
      reasoning.push(`${area}: ${areaPoints}pts`);
    }
  });
  
  // 🔥 REALISTIC MEGA-BONUS (reduced from insane levels)
  const totalCards = combo.totalCards;
  let megaBonus = 0;
  
  if (totalCards >= 4) {
    megaBonus = (totalCards - 3) * 8; // Much more reasonable: 4 cards = +8, 5 cards = +16, 6 cards = +24
    reasoning.push(`🔥 MEGA BONUS: ${megaBonus}pts (${totalCards} cards)`);
  }
  
  // Multi-area bonus
  const numAreas = areasUsed.length;
  if (numAreas >= 2) {
    const multiAreaBonus = (numAreas - 1) * 5; // 2 areas = +5, 3 areas = +10, 4 areas = +15
    megaBonus += multiAreaBonus;
    reasoning.push(`🎯 MULTI-AREA: +${multiAreaBonus}pts (${numAreas} areas)`);
  }
  
  score += megaBonus;
  
  // Personality adjustments (smaller bonuses)
  if (personality === 'adaptive' && totalCards >= 5) {
    score += 10; // Reduced from 25
    reasoning.push('🧠 ADAPTIVE: Spectacular play bonus');
  } else if (personality === 'strategist' && areasUsed.length >= 3) {
    score += 8; // Reduced from 20
    reasoning.push('🎯 STRATEGIST: Complexity bonus');
  }
  
  return {
    totalScore: Math.round(score),
    basePoints: basePoints,
    megaBonus: Math.round(megaBonus),
    totalCards: totalCards,
    areasUsed: areasUsed,
    reasoning: reasoning.join(', ')
  };
}

// 🔧 UTILITY: Get combinations of arrays (UNCHANGED)
getCombinations(array, size) {
  if (size === 1) return array.map(item => [item]);
  if (size > array.length) return [];
  
  const combinations = [];
  
  for (let i = 0; i <= array.length - size; i++) {
    const head = array[i];
    const tailCombinations = this.getCombinations(array.slice(i + 1), size - 1);
    
    for (const tail of tailCombinations) {
      combinations.push([head, ...tail]);
    }
  }
  
  return combinations;
}
  
  // 📊 EVALUATE CAPTURE OPPORTUNITY
  evaluateCapture(handCard, capture, personality = 'calculator') {
    let score = 0;
    let reasoning = [];
    
    // Base points from captured cards
    const basePoints = this.calculateCapturePoints(handCard, capture);
    score += basePoints;
    reasoning.push(`Base: ${basePoints}pts`);
    
    // Strategic bonuses based on personality
    if (personality === 'calculator') {
      score += capture.targets?.length * 2 || 0;
      reasoning.push('Calculator: Multi-card bonus');
    } else if (personality === 'strategist') {
      const controlBonus = this.calculateBoardControlBonus(capture);
      score += controlBonus;
      reasoning.push(`Strategist: Control +${controlBonus}`);
    } else if (personality === 'adaptive') {
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
  
  // 🛡️ FIND SAFEST CARD TO PLACE
  findSafestCardToPlace(handCards, boardCards, personality = 'calculator') {
    if (!handCards || handCards.length === 0) {
      console.log('🚨 AI SAFETY: No cards in hand to place');
      return null;
    }
    
    const placements = [];
    
    for (let i = 0; i < handCards.length; i++) {
      const handCard = handCards[i];
      
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
  
  // 🎯 CALCULATE CAPTURE RISK
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
  
  // 🔍 ANALYZE COMBINATION RISKS
  analyzeCombinationRisks(cardToPlace, boardCard) {
    const risks = { riskScore: 0, reasons: [] };
    
    // PAIR RISK: Placing same value as board card
    if (cardToPlace.value === boardCard.value) {
      const remaining = this.getRemainingCards(cardToPlace.value);
      const pairRisk = Math.max(20, remaining * 15);
      risks.riskScore += pairRisk;
      risks.reasons.push(`PAIR RISK: ${remaining} more ${cardToPlace.value}s available (${pairRisk}%)`);
    }
    
    // SUM RISK: Check if these cards could form sum combinations
    const sumRisks = this.calculateSumRisks(cardToPlace, boardCard);
    risks.riskScore += sumRisks.riskScore;
    risks.reasons.push(...sumRisks.reasons);
    
    return risks;
  }
  
  // 🧮 CALCULATE SUM RISKS
  calculateSumRisks(cardToPlace, boardCard) {
    const risks = { riskScore: 0, reasons: [] };
    
    const placeValue = this.getNumericValue(cardToPlace.value);
    const boardValue = this.getNumericValue(boardCard.value);
    
    if (placeValue === null || boardValue === null) {
      return risks; // Skip face cards
    }
    
    const targetSum = placeValue + boardValue;
    
    if (targetSum <= 10) {
      const remaining = this.getRemainingCards(targetSum.toString());
      if (remaining > 0) {
        const sumRisk = remaining * 8;
        risks.riskScore += sumRisk;
        risks.reasons.push(`SUM RISK: ${placeValue}+${boardValue}=${targetSum}, ${remaining} cards can capture (${sumRisk}%)`);
      }
    }
    
    return risks;
  }
  
  // 🎮 UPDATE GAME PHASE
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
    return isNaN(num) ? null : num;
  }
  
  getCardPointValue(card) {
    const pointsMap = {
      'A': 15, 'K': 10, 'Q': 10, 'J': 10, '10': 10,
      '9': 5, '8': 5, '7': 5, '6': 5, '5': 5, '4': 5, '3': 5, '2': 5
    };
    return pointsMap[card.value] || 0;
  }
  
  getCardStrategicValue(card) {
    const pointValue = this.getCardPointValue(card);
    let strategicValue = pointValue;
    
    // Face cards are extra valuable
    if (['J', 'Q', 'K'].includes(card.value)) {
      strategicValue += 15;
    }
    
    // Aces are EXTREMELY valuable
    if (card.value === 'A') {
      strategicValue += 25;
    }
    
    // Low number cards are safer to place
    const numValue = this.getNumericValue(card.value);
    if (numValue && numValue <= 4) {
      strategicValue -= 10;
    }
    
    return strategicValue;
  }
  
  calculateCapturePoints(handCard, capture) {
    const allCards = [handCard, ...(capture.targets || [])];
    return allCards.reduce((total, card) => total + this.getCardPointValue(card), 0);
  }
  
  calculateBoardControlBonus(capture) {
    return (capture.targets?.length || 0) * 3;
  }
  
  calculateAdaptiveBonus(capture) {
    if (this.gamePhase === 'endgame') {
      return 10;
    }
    return 0;
  }
  
  getPhaseRiskMultiplier() {
    const multipliers = {
      'early': 0.8,
      'mid': 1.0,
      'late': 1.3,
      'endgame': 1.6
    };
    return multipliers[this.gamePhase] || 1.0;
  }
  
  getRiskRecommendation(riskScore) {
    if (riskScore < 20) return 'SAFE';
    if (riskScore < 40) return 'MODERATE';
    if (riskScore < 70) return 'RISKY';
    return 'DANGEROUS';
  }
  
  // 🔍 DEBUG FUNCTIONS
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

// ============================================================================
// 🎯 AI PERSONALITY SYSTEM
// ============================================================================

class AIPersonalities {
  constructor(intelligence) {
    this.intelligence = intelligence;
  }
  
  // 🧠 STRATEGIC CAPTURE EVALUATION
  evaluateCaptureDecision(captureOption, personality, difficulty) {
    if (!captureOption || !captureOption.evaluation) {
      console.log('🚨 AI SAFETY: Invalid capture option');
      return false;
    }
    
    const evaluation = captureOption.evaluation;
    
    // Base threshold: Always take high-value captures
    if (evaluation.basePoints >= 25) {
      console.log(`💎 HIGH VALUE CAPTURE: ${evaluation.basePoints} pts - TAKING IT!`);
      return true;
    }
    
    // Personality-based decisions
    if (personality === 'calculator') {
      return evaluation.basePoints >= 10;
    } else if (personality === 'strategist') {
      const hasStrategicValue = evaluation.totalScore > evaluation.basePoints;
      return evaluation.basePoints >= 8 || hasStrategicValue;
    } else if (personality === 'adaptive') {
      const gamePhase = this.intelligence.gamePhase;
      
      if (gamePhase === 'endgame') {
        return evaluation.basePoints >= 5;
      } else if (gamePhase === 'early') {
        return evaluation.basePoints >= 8;
      } else {
        return evaluation.basePoints >= 10;
      }
    }
    
    return evaluation.basePoints >= 12;
  }
  
  // 🎯 DETERMINE BOT PERSONALITY
  getPersonalityForDifficulty(difficulty) {
    if (difficulty === 'beginner') {
      return 'calculator'; // Simple logic when they do capture
    } else if (difficulty === 'intermediate') {
      const personalities = ['calculator', 'strategist'];
      return personalities[Math.floor(Math.random() * personalities.length)];
    } else if (difficulty === 'legendary') {
      return 'adaptive';
    }
    
    return 'calculator';
  }
}

// ============================================================================
// 🎭 BOT ACTION EXECUTOR
// ============================================================================

class BotActionExecutor {
  constructor(gameEngine, uiSystem) {
    this.game = gameEngine;
    this.ui = uiSystem;
    this.isAnimating = false;
  }
  
  // 🤖 DRAG CARD TO COMBO SLOT
  async botDragCardToSlot(card, sourceType, sourceIndex, targetSlot) {
    console.log(`🤖 BOT: Dragging ${card.value}${card.suit} from ${sourceType}[${sourceIndex}] to ${targetSlot}`);

    const currentPlayer = this.game.state.currentPlayer;
    const cardEntry = {
      source: sourceType,
      index: sourceIndex,
      card: card,
      playerSource: currentPlayer,
      fromBot: currentPlayer !== 0
    };

    console.log(`🤖 BOT CARD ENTRY: Player ${currentPlayer} adding ${card.value}${card.suit} from ${sourceType}[${sourceIndex}]`);

    // Safety check: Verify card exists in source location
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

    // Give DOM time to update
    await this.delay(800);
    this.ui.render();
    
    // Verify card was placed correctly
    const cardCount = this.game.state.combination[targetSlot].length;
    console.log(`🤖 BOT: Verified ${targetSlot} now has ${cardCount} cards`);
    
    return true;
  }
  
  // 🎯 EXECUTE CAPTURE
  // 🔧 REPLACE executeCapture() function in aiSystem.js around line 940
// This fixes the missing target card placement

async executeCapture(move, playerIndex) {
  if (this.isAnimating) return { success: false, reason: 'Already animating' };
  this.isAnimating = true;

  console.log(`🤖 BOT ${playerIndex}: Attempting modal capture`);
  console.log(`🔍 MOVE DEBUG:`, {
    type: move.type,
    handCard: move.handCard.value + move.handCard.suit,
    captureType: move.capture?.type,
    targets: move.capture?.targets?.length || 0
  });
  
  try {
    // Check if combo areas are occupied
    const totalCardsInCombo = this.game.state.combination.base.length +
                             this.game.state.combination.sum1.length +
                             this.game.state.combination.sum2.length +
                             this.game.state.combination.sum3.length +
                             this.game.state.combination.match.length;
                             
    if (totalCardsInCombo > 0) {
      console.log(`🤖 BOT: Combo areas occupied (${totalCardsInCombo} cards), clearing first`);
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
    console.log(`🤖 BOT: Modal reset complete`);
    
    // STEP 2: Place base card
    console.log(`🤖 BOT: Placing base card ${baseCard.value}${baseCard.suit}`);
    const baseSuccess = await this.botDragCardToSlot(baseCard, 'hand', handIndex, 'base');
    
    if (!baseSuccess || this.game.state.combination.base.length !== 1) {
      console.log(`🚨 BOT: Base card failed to place! Count: ${this.game.state.combination.base.length}`);
      this.isAnimating = false;
      return { success: false, reason: 'Base card placement failed' };
    }
    console.log(`✅ BOT: Base card verified in place`);
    
    // STEP 3: Add target cards - FIXED LOGIC!
    if (move.capture && move.capture.targets && move.capture.targets.length > 0) {
      console.log(`🎯 BOT: Adding ${move.capture.targets.length} target cards`);
      
      for (let i = 0; i < move.capture.targets.length; i++) {
        const targetCard = move.capture.targets[i];
        const boardIndex = this.game.state.board.findIndex(bc => bc.id === targetCard.id);
        
        if (boardIndex !== -1) {
          // Determine correct area based on capture rules
          let targetArea = 'sum1'; // Default for sum captures
          
          // For pair captures (same value), use match area
          if (targetCard.value === baseCard.value) {
            targetArea = 'match';
            console.log(`🎯 BOT: PAIR CAPTURE - Adding ${targetCard.value}${targetCard.suit} to MATCH area`);
          } else {
            console.log(`🎯 BOT: SUM CAPTURE - Adding ${targetCard.value}${targetCard.suit} to SUM1 area`);
          }
          
          const success = await this.botDragCardToSlot(targetCard, 'board', boardIndex, targetArea);
          
          if (!success) {
            console.error(`🚨 BOT: Failed to add target card ${targetCard.value}${targetCard.suit}`);
            this.isAnimating = false;
            return { success: false, reason: 'Target card placement failed' };
          }
          
          console.log(`✅ BOT: Successfully added ${targetCard.value}${targetCard.suit} to ${targetArea}`);
        } else {
          console.error(`🚨 BOT: Target card ${targetCard.value}${targetCard.suit} not found on board`);
          this.isAnimating = false;
          return { success: false, reason: 'Target card not found on board' };
        }
      }
    } else {
      console.error(`🚨 BOT: No target cards found in move.capture.targets`);
      console.log(`🔍 BOT DEBUG: move.capture =`, move.capture);
      this.isAnimating = false;
      return { success: false, reason: 'No target cards' };
    }
    
    // STEP 4: Submit capture
    const baseCount = this.game.state.combination.base.length;
    const captureCount = this.game.state.combination.sum1.length + 
                        this.game.state.combination.sum2.length + 
                        this.game.state.combination.sum3.length + 
                        this.game.state.combination.match.length;
                        
    console.log(`🤖 BOT: Final check - Base: ${baseCount}, Captures: ${captureCount}`);
    
    if (baseCount === 1 && captureCount > 0) {
      console.log(`✅ BOT: Ready to submit - Base: ${baseCount}, Captures: ${captureCount}`);
      const submitResult = await this.botSubmitCapture();
      this.isAnimating = false;
      return submitResult;
    } else {
      console.log(`🚨 BOT: Final verification failed - Base: ${baseCount}, Captures: ${captureCount}`);
      this.isAnimating = false;
      return { success: false, reason: 'Final verification failed' };
    }
    
  } catch (error) {
    console.error('🚨 Bot capture error:', error);
    this.isAnimating = false;
    return { success: false, reason: error.message };
  }
}
  
  // 🎯 SUBMIT CAPTURE
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
  
  // 🎯 EXECUTE BOT SUBMIT
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

    // Use GameEngine's executeCapture() for proper card removal
    this.game.executeCapture(baseCard, validCaptures, allCapturedCards);

    // Track bot last action
    this.game.state.lastAction = 'capture';
    console.log('🎯 BOT LAST ACTION SET TO: capture');

    // Notify mode of capture
    if (this.game.currentMode.onCapture) {
      this.game.currentMode.onCapture(this.game, allCapturedCards);
    }

    // Reset combination state
    this.game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
    
    this.ui.render();
    if (window.playSound) window.playSound('capture');
    return true;
  }
  
  // 🔄 RESET MODAL
  async botResetModal() {
    console.log(`🤖 BOT: Resetting modal - RESTORING cards to original locations`);
    
    const combination = this.game.state.combination;
    let restoredCount = 0;
    
    // Restore cards from each combination area
    Object.keys(combination).forEach(area => {
      if (combination[area] && Array.isArray(combination[area])) {
        combination[area].forEach(entry => {
          if (entry.source === 'hand' && entry.playerSource !== undefined) {
            if (this.game.state.hands[entry.playerSource]) {
              this.game.state.hands[entry.playerSource].push(entry.card);
              restoredCount++;
              console.log(`✅ RESTORED: ${entry.card.value}${entry.card.suit} to Player ${entry.playerSource} hand`);
            }
          } else if (entry.source === 'board') {
            this.game.state.board.push(entry.card);
            restoredCount++;
            console.log(`✅ RESTORED: ${entry.card.value}${entry.card.suit} to board`);
          }
        });
      }
    });
    
    console.log(`🔄 BOT RESET: Restored ${restoredCount} cards to their original locations`);
    
    // Clear combination after restoration
    this.game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
    
    this.ui.render();
    await this.delay(500);
    
    return true;
  }
  
  // 🎴 PLACE CARD
  async placeCard(handCard, playerIndex) {
    if (this.isAnimating) return { success: false, reason: 'Already animating' };
    this.isAnimating = true;

    // Safety checks
    if (!this.game.state.hands[playerIndex] || this.game.state.hands[playerIndex].length === 0) {
      console.error(`🚨 SAFETY GUARD: Bot ${playerIndex} has no cards to place!`);
      this.isAnimating = false;
      return { success: false, reason: 'No cards available' };
    }

    if (!handCard || !handCard.value || !handCard.suit) {
      console.error(`🚨 SAFETY GUARD: Invalid handCard provided to placeCard!`, handCard);
      this.isAnimating = false;
      return { success: false, reason: 'Invalid card' };
    }

    console.log(`🤖 BOT ${playerIndex}: PLACING ${handCard.value}${handCard.suit} on board`);
    
    try {
      await this.delay(500);

      // Verify card exists in bot's hand
      const cardIndex = this.game.state.hands[playerIndex].findIndex(c => c && c.id === handCard.id);
      if (cardIndex === -1) {
        console.error(`🚨 CRITICAL: Card ${handCard.value}${handCard.suit} not found in Bot ${playerIndex} hand!`);
        this.isAnimating = false;
        return { success: false, reason: 'Card not found in hand' };
      }
      
      // Remove from bot's hand
      this.game.state.hands[playerIndex].splice(cardIndex, 1);
      console.log(`✅ REMOVED: ${handCard.value}${handCard.suit} from Bot ${playerIndex} hand (${this.game.state.hands[playerIndex].length} cards left)`);

      // Track bot last action
      this.game.state.lastAction = 'place';
      console.log('🎯 BOT LAST ACTION SET TO: place');
      
      // Add to board
      this.game.state.board.push(handCard);
      
      console.log(`✅ ADDED: ${handCard.value}${handCard.suit} to board (${this.game.state.board.length} cards total)`);
      
      // Clear combo areas
      this.game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
      console.log(`✅ CLEARED: All combo areas`);
      
      // Update UI
      this.ui.render();
      console.log(`✅ RENDERED: UI updated`);
      
      this.isAnimating = false;
      return { success: true, action: 'place', remainingCards: this.game.state.hands[playerIndex].length };
      
    } catch (error) {
      console.error(`🚨 CRITICAL ERROR in placeCard:`, error);
      this.isAnimating = false;
      return { success: false, reason: error.message };
    }
  }
  
  // 🎯 HELPER: Delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// 🚀 MAIN AI SYSTEM - CLEAN PUBLIC API
// ============================================================================

class AISystemCore {
  constructor() {
    this.intelligence = new CardIntelligenceEngine();
    this.personalities = new AIPersonalities(this.intelligence);
    this.executor = null; // Will be set when game systems are available
    
    console.log('🚀 AI SYSTEM CORE INITIALIZED - READY FOR EPIC GAMEPLAY!');
  }
  
  // 🎯 INITIALIZE WITH GAME SYSTEMS
  initialize(gameEngine, uiSystem) {
    this.executor = new BotActionExecutor(gameEngine, uiSystem);
    console.log('🔗 AI SYSTEM CONNECTED TO GAME SYSTEMS');
  }
  
  // 🤖 MAIN BOT MOVE FUNCTION (PUBLIC API)
  makeMove(hand, board, difficulty = 'intermediate') {
    console.log(`🤖 AI SYSTEM ACTIVATED: Difficulty=${difficulty}, Hand=${hand.length}, Board=${board.length}`);
    
    // Safety checks
    if (!hand || hand.length === 0) {
      console.log('🚨 AI SAFETY: Bot has no cards - cannot make move');
      return null;
    }
    
    if (!board) {
      console.log('🚨 AI SAFETY: Invalid board state');
      return null;
    }
    
    // Determine personality for this difficulty
    const personality = this.personalities.getPersonalityForDifficulty(difficulty);
    let beginnerRandomChance = 0;

    if (difficulty === 'beginner') {
      beginnerRandomChance = 0.4; // 40% chance to place randomly after checking captures
    }
    
    console.log(`🧠 AI PERSONALITY: ${personality.toUpperCase()}`);
    
    // PHASE 1: Look for captures (ALL difficulties check this first!)
    const bestCapture = this.intelligence.findBestCapture(hand, board, personality);
    
    if (bestCapture) {
      console.log(`🎯 CAPTURE FOUND: ${bestCapture.handCard.value}${bestCapture.handCard.suit} → ${bestCapture.evaluation.totalScore} pts`);
      
      // Strategic decision: Should we take this capture?
      const shouldCapture = this.personalities.evaluateCaptureDecision(bestCapture, personality, difficulty);
      
      if (shouldCapture) {
        // Beginner behavior: Even with a good capture, sometimes act "beginner-like"
        if (difficulty === 'beginner' && Math.random() < beginnerRandomChance) {
          console.log(`🎓 BEGINNER: Found good capture but acting beginner-like - placing random card`);
          const randomCard = hand[Math.floor(Math.random() * hand.length)];
          return { action: 'place', handCard: randomCard };
        }
        
        console.log(`✅ TAKING CAPTURE: ${bestCapture.evaluation.reasoning}`);
        return {
          action: 'capture',
          handCard: bestCapture.handCard,
          capture: {
            type: bestCapture.capture.type,
            cards: bestCapture.capture.cards,
            targets: bestCapture.capture.targets || []
          }
        };
      } else {
        console.log(`🤔 DECLINING CAPTURE: Strategic reasons`);
      }
    }
    
    // PHASE 2: No good captures - strategic placement
    const safestPlacement = this.intelligence.findSafestCardToPlace(hand, board, personality);
    
    if (safestPlacement && safestPlacement.handCard) {
      console.log(`🛡️ STRATEGIC PLACEMENT: ${safestPlacement.handCard.value}${safestPlacement.handCard.suit}`);
      console.log(`   Risk: ${safestPlacement.riskAnalysis.riskScore.toFixed(1)}% | Recommendation: ${safestPlacement.riskAnalysis.recommendation}`);
      
      return { action: 'place', handCard: safestPlacement.handCard };
    }
    
    // FALLBACK: Emergency placement
    console.warn('🚨 AI FALLBACK: Card Intelligence failed, using emergency placement');
    
    if (hand && hand.length > 0) {
      const emergencyCard = hand[0];
      console.log(`🚨 EMERGENCY PLACEMENT: ${emergencyCard.value}${emergencyCard.suit}`);
      return { action: 'place', handCard: emergencyCard };
    }
    
    // Ultimate safety
    console.error('🚨 CRITICAL AI ERROR: No valid moves possible');
    return null;
  }
  
  // 💡 HINT SYSTEM INTEGRATION (PUBLIC API)
  getPlayerHints(hand, board) {
    console.log(`💡 HINT SYSTEM: Analyzing ${hand.length} hand cards vs ${board.length} board cards`);
    
    if (!hand || hand.length === 0) {
      return [];
    }
    
    // Use calculator personality for clean, educational hints
    const bestCapture = this.intelligence.findBestCapture(hand, board, 'calculator');
    
    if (bestCapture) {
      console.log(`💡 HINT FOUND: ${bestCapture.evaluation.reasoning}`);
      
      // Convert to hint format
      const hint = {
        type: bestCapture.capture.type,
        handCard: bestCapture.handCard,
        handIndex: bestCapture.handIndex,
        targetCards: bestCapture.capture.targets,
        area: bestCapture.capture.type === 'pair' ? 'match' : 'sum1',
        score: bestCapture.evaluation.totalScore,
        description: bestCapture.evaluation.reasoning
      };
      
      return [hint];
    }
    
    console.log(`💡 NO HINTS: No captures available`);
    return [];
  }
  
  // 🧠 CARD MEMORY MANAGEMENT (PUBLIC API)
  updateCardMemory(cards) {
    this.intelligence.updateCardsSeen(cards);
  }
  
  resetCardMemory() {
    this.intelligence.reset();
    console.log('🔄 AI CARD MEMORY RESET');
  }
  
  // 🎭 BOT ACTION EXECUTION (PUBLIC API)
  async executeCapture(move, playerIndex) {
    if (!this.executor) {
      console.error('🚨 AI EXECUTOR NOT INITIALIZED');
      return { success: false, reason: 'AI system not properly initialized' };
    }
    
    return await this.executor.executeCapture(move, playerIndex);
  }
  
  async placeCard(handCard, playerIndex) {
    if (!this.executor) {
      console.error('🚨 AI EXECUTOR NOT INITIALIZED');
      return { success: false, reason: 'AI system not properly initialized' };
    }
    
    return await this.executor.placeCard(handCard, playerIndex);
  }
  
  // 🔍 DEBUG FUNCTIONS (PUBLIC API)
  debugCardKnowledge() {
    this.intelligence.debugCardKnowledge();
  }
  
  debugCardState(gameEngine) {
    if (!gameEngine) return;
    
    console.log(`🔍 CARD STATE DEBUG:`);
    console.log(`   Player hand: ${gameEngine.state.hands[0].length} cards`);
    console.log(`   Bot 1 hand: ${gameEngine.state.hands[1].length} cards`);
    console.log(`   Bot 2 hand: ${gameEngine.state.hands[2].length} cards`);
    console.log(`   Board: ${gameEngine.state.board.length} cards`);
    console.log(`   Deck: ${gameEngine.state.deck.length} cards`);
    
    const totalCards = gameEngine.state.hands[0].length + 
                      gameEngine.state.hands[1].length + 
                      gameEngine.state.hands[2].length + 
                      gameEngine.state.board.length + 
                      gameEngine.state.deck.length;
    console.log(`   TOTAL CARDS: ${totalCards} (should be 52)`);
    
    if (totalCards !== 52) {
      console.error(`🚨 CARD COUNT MISMATCH! Missing ${52 - totalCards} cards!`);
    }
  }
  
  // 🎯 SYSTEM INFO (PUBLIC API)
  getSystemInfo() {
    return {
      version: '1.0.0',
      features: ['Strategic Analysis', 'Educational Modes', 'Card Memory', 'Risk Assessment'],
      personalities: ['calculator', 'strategist', 'adaptive'],
      difficulties: ['beginner', 'intermediate', 'legendary']
    };
  }
}

// ============================================================================
// 🌍 GLOBAL AI SYSTEM INSTANCE
// ============================================================================

// Create the global AI system
window.AISystem = new AISystemCore();

// 🔥 BACKWARD COMPATIBILITY: Keep old function name as alias
window.aiMove = function(hand, board, difficulty) {
  return window.AISystem.makeMove(hand, board, difficulty);
};

// Export classes for advanced usage
window.CardIntelligenceEngine = CardIntelligenceEngine;
window.AIPersonalities = AIPersonalities;
window.BotActionExecutor = BotActionExecutor;
window.AISystemCore = AISystemCore;

console.log('🎉 STACKED! AI SYSTEM LOADED - EPIC STRATEGIC INTELLIGENCE READY! 🎉');

// ============================================================================
// 🚀 INITIALIZATION HELPER
// ============================================================================

// Helper function to initialize AI system with game components
window.initializeAISystem = function(gameEngine, uiSystem) {
  if (window.AISystem) {
    window.AISystem.initialize(gameEngine, uiSystem);
    console.log('✅ AI SYSTEM FULLY INITIALIZED AND READY FOR BATTLE!');
  } else {
    console.error('🚨 AI SYSTEM NOT FOUND - INITIALIZATION FAILED');
  }
};