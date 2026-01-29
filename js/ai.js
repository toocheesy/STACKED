// 🤖 LEGENDARY AI MOVE FUNCTION - Strategic Genius Level
// BULLETPROOF VERSION with Empty Hand Safety Guards
// 🔥 FIXED: Beginner bots now ALWAYS check captures first!

function aiMove(hand, board, difficulty = 'intermediate') {
  // 🔥 CRITICAL SAFETY CHECK: Don't try to move with empty hand!
  if (!hand || hand.length === 0) {
    return null;
  }

  // 🔥 ADDITIONAL SAFETY: Validate board exists
  if (!board) {
    return null;
  }

  // 🧠 USE CARD INTELLIGENCE FOR STRATEGIC DECISIONS
  if (!window.cardIntelligence) {
    return basicAiMove(hand, board, difficulty);
  }
  
  // 🎯 DETERMINE BOT PERSONALITY BASED ON DIFFICULTY
  let personality = 'calculator';
  let beginnerRandomChance = 0; // Will be set for beginners

  if (difficulty === 'beginner') {
    // 🔥 NEW STRATEGY: Always check captures first, then decide if we want to act "beginner-like"
    personality = 'calculator'; // Use simple logic when they do capture
    beginnerRandomChance = 0.4; // 40% chance to place randomly AFTER checking captures
  } else if (difficulty === 'intermediate') {
    // Intermediate: Mix of personalities
    const personalities = ['calculator', 'strategist'];
    personality = personalities[Math.floor(Math.random() * personalities.length)];
  } else if (difficulty === 'legendary') {
    // Legendary: Adaptive intelligence that changes based on game state
    personality = 'adaptive';
  }

  // 🎯 PHASE 1: LOOK FOR CAPTURES (Strategic Analysis) - NOW HAPPENS FOR ALL DIFFICULTIES!
  const bestCapture = window.cardIntelligence.findBestCapture(hand, board, personality);
  
  if (bestCapture) {
    // 🧠 STRATEGIC DECISION: Should we take this capture?
    const shouldCapture = evaluateCaptureDecision(bestCapture, personality, difficulty);

    if (shouldCapture) {
      // 🎓 BEGINNER BEHAVIOR: Even with a good capture, sometimes act "beginner-like"
      if (difficulty === 'beginner' && Math.random() < beginnerRandomChance) {
        const randomCard = hand[Math.floor(Math.random() * hand.length)];
        return { action: 'place', handCard: randomCard };
      }
      return {
        action: 'capture',
        handCard: bestCapture.handCard,
        capture: {
          type: bestCapture.capture.type,
          cards: bestCapture.capture.cards,
          targets: bestCapture.capture.targets || bestCapture.capture.cards.map(idx => board[idx])
        }
      };
    }
  }
  
  // 🎯 PHASE 2: NO GOOD CAPTURES - STRATEGIC PLACEMENT
  const safestPlacement = window.cardIntelligence.findSafestCardToPlace(hand, board, personality);

  if (safestPlacement && safestPlacement.handCard) {
    return { action: 'place', handCard: safestPlacement.handCard };
  }

  // 🚨 FALLBACK: Emergency placement if card intelligence fails
  // 🔥 SAFETY FALLBACK: Make sure we still have cards before emergency placement
  if (hand && hand.length > 0) {
    const emergencyCard = hand[0]; // Just take the first card
    return { action: 'place', handCard: emergencyCard };
  }
  
  // 🚨 ULTIMATE SAFETY: If we somehow get here, return null
  console.error('🚨 CRITICAL AI ERROR: No valid moves possible');
  return null;
}

// 🧠 STRATEGIC CAPTURE EVALUATION
function evaluateCaptureDecision(captureOption, personality, difficulty) {
  // 🔥 SAFETY CHECK: Make sure we have a valid capture option
  if (!captureOption || !captureOption.evaluation) {
    return false;
  }

  const evaluation = captureOption.evaluation;

  // Base threshold: Always take high-value captures
  if (evaluation.basePoints >= 25) {
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
      return evaluation.basePoints >= 8; // Take decent captures early
    } else {
      return evaluation.basePoints >= 10; // Standard mid-game
    }
  }
  
  return evaluation.basePoints >= 12; // Default threshold
}

// 🚨 FALLBACK FUNCTION (in case Card Intelligence fails)
function basicAiMove(hand, board, difficulty) {
  // 🔥 SAFETY CHECK: Validate inputs for basic AI too
  if (!hand || hand.length === 0) {
    return null;
  }

  if (!board) {
    board = []; // Use empty board for basic AI
  }
  
  // Simple capture logic
  for (const handCard of hand) {
    // 🔥 SAFETY: Make sure canCapture function exists and card is valid
    if (!handCard || typeof canCapture !== 'function') {
      continue;
    }
    
    try {
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
    } catch (error) {
      console.error('🚨 Error in basic AI capture logic:', error);
      continue; // Try next card
    }
  }
  
  // No captures - place lowest value card
  try {
    const sortedHand = [...hand].sort((a, b) => {
      const aVal = a.value === 'A' ? 1 : (parseInt(a.value) || 10);
      const bVal = b.value === 'A' ? 1 : (parseInt(b.value) || 10);
      return aVal - bVal;
    });
    
    if (sortedHand.length > 0) {
      return { action: 'place', handCard: sortedHand[0] };
    }
  } catch (error) {
    console.error('🚨 Error in basic AI placement logic:', error);
  }

  // 🚨 ULTIMATE FALLBACK: If everything fails, just place first card
  if (hand && hand.length > 0) {
    return { action: 'place', handCard: hand[0] };
  }

  console.error('🚨 CRITICAL: Basic AI cannot make any move');
  return null;
}