// REPLACE your aiMove function in ai.js with this fixed version:

// 🤖 LEGENDARY AI MOVE FUNCTION - Strategic Genius Level
// REPLACE your entire aiMove() function in ai.js with this:

function aiMove(hand, board, difficulty = 'intermediate') {
  console.log(`🤖 LEGENDARY AI ACTIVATED: Difficulty=${difficulty}, Hand=${hand.length}, Board=${board.length}`);
  
  // 🧠 USE CARD INTELLIGENCE FOR STRATEGIC DECISIONS
  if (!window.cardIntelligence) {
    console.warn('⚠️ Card Intelligence not loaded - falling back to basic AI');
    return basicAiMove(hand, board, difficulty);
  }
  
  // 🎯 DETERMINE BOT PERSONALITY BASED ON DIFFICULTY
  let personality = 'calculator';
  if (difficulty === 'beginner') {
    // Beginner: 70% chance to just place random card (keep it simple)
    if (Math.random() < 0.7) {
      const randomCard = hand[Math.floor(Math.random() * hand.length)];
      console.log(`🟢 BEGINNER: Random placement ${randomCard.value}${randomCard.suit}`);
      return { action: 'place', handCard: randomCard };
    }
    personality = 'calculator'; // Simple when they do try
  } else if (difficulty === 'intermediate') {
    // Intermediate: Mix of personalities
    const personalities = ['calculator', 'strategist'];
    personality = personalities[Math.floor(Math.random() * personalities.length)];
  } else if (difficulty === 'legendary') {
    // Legendary: Adaptive intelligence that changes based on game state
    personality = 'adaptive';
  }
  
  console.log(`🧠 AI PERSONALITY: ${personality.toUpperCase()}`);
  
  // 🎯 PHASE 1: LOOK FOR CAPTURES (Strategic Analysis)
  const bestCapture = window.cardIntelligence.findBestCapture(hand, board, personality);
  
  if (bestCapture) {
    console.log(`🎯 CAPTURE FOUND: ${bestCapture.handCard.value}${bestCapture.handCard.suit} → ${bestCapture.evaluation.totalScore} pts`);
    
    // 🧠 STRATEGIC DECISION: Should we take this capture?
    const shouldCapture = evaluateCaptureDecision(bestCapture, personality, difficulty);
    
    if (shouldCapture) {
      console.log(`✅ TAKING CAPTURE: ${bestCapture.evaluation.reasoning}`);
      return {
        action: 'capture',
        handCard: bestCapture.handCard,
        capture: {
          type: bestCapture.capture.type,
          cards: bestCapture.capture.cards,
          targets: bestCapture.capture.targets || bestCapture.capture.cards.map(idx => board[idx])
        }
      };
    } else {
      console.log(`🤔 DECLINING CAPTURE: Strategic reasons`);
    }
  }
  
  // 🎯 PHASE 2: NO GOOD CAPTURES - STRATEGIC PLACEMENT
  const safestPlacement = window.cardIntelligence.findSafestCardToPlace(hand, board, personality);
  
  if (safestPlacement) {
    console.log(`🛡️ STRATEGIC PLACEMENT: ${safestPlacement.handCard.value}${safestPlacement.handCard.suit}`);
    console.log(`   Risk: ${safestPlacement.riskAnalysis.riskScore.toFixed(1)}% | Recommendation: ${safestPlacement.riskAnalysis.recommendation}`);
    
    return { action: 'place', handCard: safestPlacement.handCard };
  }
  
  // 🚨 FALLBACK: Should never reach here, but safety first
  console.warn('🚨 AI FALLBACK: Using random card');
  const fallbackCard = hand[Math.floor(Math.random() * hand.length)];
  return { action: 'place', handCard: fallbackCard };
}

// 🧠 STRATEGIC CAPTURE EVALUATION
function evaluateCaptureDecision(captureOption, personality, difficulty) {
  const evaluation = captureOption.evaluation;
  
  // Base threshold: Always take high-value captures
  if (evaluation.basePoints >= 25) {
    console.log(`💎 HIGH VALUE CAPTURE: ${evaluation.basePoints} pts - TAKING IT!`);
    return true;
  }
  
  // Personality-based decisions
  if (personality === 'calculator') {
    // Pure math: Take anything worth 10+ points
    return evaluation.basePoints >= 10;
  } else if (personality === 'strategist') {
    // Board control: Consider strategic value beyond points
    const hasStrategicValue = evaluation.totalScore > evaluation.basePoints; // Has bonus
    return evaluation.basePoints >= 8 || hasStrategicValue;
  } else if (personality === 'adaptive') {
    // Context-based: Adapt to game situation
    const gamePhase = window.cardIntelligence.gamePhase;
    
    if (gamePhase === 'endgame') {
      return evaluation.basePoints >= 5; // More aggressive in endgame
    } else if (gamePhase === 'early') {
      return evaluation.basePoints >= 15; // More selective early
    } else {
      return evaluation.basePoints >= 10; // Standard mid-game
    }
  }
  
  return evaluation.basePoints >= 12; // Default threshold
}

// 🚨 FALLBACK FUNCTION (in case Card Intelligence fails)
function basicAiMove(hand, board, difficulty) {
  console.log(`🚨 BASIC AI FALLBACK: ${difficulty}`);
  
  // Simple capture logic
  for (const handCard of hand) {
    const captures = canCapture(handCard, board);
    if (captures && captures.length > 0) {
      const firstCapture = captures[0];
      return {
        action: 'capture',
        handCard: handCard,
        capture: {
          type: firstCapture.type,
          cards: firstCapture.cards,
          targets: firstCapture.targets || firstCapture.cards.map(idx => board[idx])
        }
      };
    }
  }
  
  // No captures - place lowest value card
  const sortedHand = [...hand].sort((a, b) => {
    const aVal = a.value === 'A' ? 1 : (parseInt(a.value) || 10);
    const bVal = b.value === 'A' ? 1 : (parseInt(b.value) || 10);
    return aVal - bVal;
  });
  
  return { action: 'place', handCard: sortedHand[0] };
}