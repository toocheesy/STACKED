// 🤖 LEGENDARY AI MOVE FUNCTION - Strategic Genius Level
// BULLETPROOF VERSION with Empty Hand Safety Guards
// 🔥 FIXED: Beginner bots now ALWAYS check captures first!

function aiMove(hand, board, difficulty = 'intermediate') {
  console.log(`🤖 LEGENDARY AI ACTIVATED: Difficulty=${difficulty}, Hand=${hand.length}, Board=${board.length}`);
  
  // 🔥 CRITICAL SAFETY CHECK: Don't try to move with empty hand!
  if (!hand || hand.length === 0) {
    console.log('🚨 AI SAFETY: Bot has no cards - cannot make move');
    return null;
  }
  
  // 🔥 ADDITIONAL SAFETY: Validate board exists
  if (!board) {
    console.log('🚨 AI SAFETY: Invalid board state');
    return null;
  }
  
  // 🧠 USE CARD INTELLIGENCE FOR STRATEGIC DECISIONS
  if (!window.cardIntelligence) {
    console.warn('⚠️ Card Intelligence not loaded - falling back to basic AI');
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
  
  console.log(`🧠 AI PERSONALITY: ${personality.toUpperCase()}`);
  
  // 🎯 PHASE 1: LOOK FOR CAPTURES (Strategic Analysis) - NOW HAPPENS FOR ALL DIFFICULTIES!
  const bestCapture = window.cardIntelligence.findBestCapture(hand, board, personality);
  
  if (bestCapture) {
    console.log(`🎯 CAPTURE FOUND: ${bestCapture.handCard.value}${bestCapture.handCard.suit} → ${bestCapture.evaluation.totalScore} pts`);
    
    // 🧠 STRATEGIC DECISION: Should we take this capture?
    const shouldCapture = evaluateCaptureDecision(bestCapture, personality, difficulty);
    
    if (shouldCapture) {
      // 🎓 BEGINNER BEHAVIOR: Even with a good capture, sometimes act "beginner-like"
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
          targets: bestCapture.capture.targets || bestCapture.capture.cards.map(idx => board[idx])
        }
      };
    } else {
      console.log(`🤔 DECLINING CAPTURE: Strategic reasons`);
    }
  }
  
  // 🎯 PHASE 2: NO GOOD CAPTURES - STRATEGIC PLACEMENT
  const safestPlacement = window.cardIntelligence.findSafestCardToPlace(hand, board, personality);
  
  if (safestPlacement && safestPlacement.handCard) {
    console.log(`🛡️ STRATEGIC PLACEMENT: ${safestPlacement.handCard.value}${safestPlacement.handCard.suit}`);
    console.log(`   Risk: ${safestPlacement.riskAnalysis.riskScore.toFixed(1)}% | Recommendation: ${safestPlacement.riskAnalysis.recommendation}`);
    
    return { action: 'place', handCard: safestPlacement.handCard };
  }
  
  // 🚨 FALLBACK: Emergency placement if card intelligence fails
  console.warn('🚨 AI FALLBACK: Card Intelligence failed, using emergency placement');
  
  // 🔥 SAFETY FALLBACK: Make sure we still have cards before emergency placement
  if (hand && hand.length > 0) {
    const emergencyCard = hand[0]; // Just take the first card
    console.log(`🚨 EMERGENCY PLACEMENT: ${emergencyCard.value}${emergencyCard.suit}`);
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
  console.log(`🚨 BASIC AI FALLBACK: ${difficulty}`);
  
  // 🔥 SAFETY CHECK: Validate inputs for basic AI too
  if (!hand || hand.length === 0) {
    console.log('🚨 BASIC AI SAFETY: No cards in hand');
    return null;
  }
  
  if (!board) {
    console.log('🚨 BASIC AI SAFETY: Invalid board');
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
    console.log('🚨 ULTIMATE FALLBACK: Placing first card');
    return { action: 'place', handCard: hand[0] };
  }
  
  console.error('🚨 CRITICAL: Basic AI cannot make any move');
  return null;
}