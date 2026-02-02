/*
 * Nina "The Natural" - Intermediate Personality
 * Weighs capture value against what it leaves for opponents.
 * Avoids dangerous placements. Goes aggressive when behind.
 */

const Nina = {
  name: 'Nina',
  title: 'The Natural',
  level: 'intermediate',
  thinkingDelay: { min: 1500, max: 2500 },

  decide(hand, board, gameState) {
    if (!hand || hand.length === 0) return null;
    if (!board) board = [];

    const aggressive = this._isAggressive(gameState);

    // Phase 1: Look for captures with value-based filtering
    const capture = this.evaluateCaptures(hand, board, aggressive);
    if (capture) return capture;

    // Phase 2: Safe placement
    return this.choosePlacement(hand, board);
  },

  evaluateCaptures(hand, board, aggressive) {
    if (board.length === 0) return null;

    let allCaptures = [];

    for (const handCard of hand) {
      const captures = canCapture(handCard, board);
      if (!captures || captures.length === 0) continue;

      for (const capture of captures) {
        const targets = capture.targets || capture.cards.map(idx => board[idx]);
        const allCards = [handCard, ...targets];
        const points = allCards.reduce((sum, c) => sum + window.getPointValue(c), 0);

        allCaptures.push({
          handCard,
          capture,
          targets,
          points
        });
      }
    }

    if (allCaptures.length === 0) return null;

    // Sort by points descending
    allCaptures.sort((a, b) => b.points - a.points);

    for (const option of allCaptures) {
      // 25+ pts: take immediately
      if (option.points >= 25) {
        return Nina._buildMove(option);
      }

      // Aggressive mode (behind 75+ pts): take 10+ captures
      if (aggressive && option.points >= 10) {
        return Nina._buildMove(option);
      }

      // 15-24 pts: check if capture leaves opponent a bigger opportunity
      if (option.points >= 15) {
        const leavesOpportunity = Nina._leavesOpponentBigger(option, hand, board);
        if (!leavesOpportunity) {
          return Nina._buildMove(option);
        }
        // Skip this capture if it leaves opponent something bigger
        continue;
      }

      // Under 15: skip unless this is our only option (forced)
      // Check if ALL captures are under 15
      const allLowValue = allCaptures.every(c => c.points < 15);
      if (allLowValue) {
        // Forced to take the best low-value capture
        return Nina._buildMove(allCaptures[0]);
      }
    }

    // If we skipped everything due to opponent checks, take best available
    return Nina._buildMove(allCaptures[0]);
  },

  choosePlacement(hand, board) {
    const ci = window.cardIntelligence;

    if (!ci) {
      // Fallback: place lowest value
      const sorted = [...hand].sort((a, b) => window.getPointValue(a) - window.getPointValue(b));
      return { action: 'place', handCard: sorted[0] };
    }

    // Score each card by danger level
    const placements = hand.map(card => {
      const risk = ci.calculateCaptureRisk(card, board);
      return { card, riskScore: risk.riskScore };
    });

    // Separate safe and dangerous
    const safe = placements.filter(p => p.riskScore < 40);
    const dangerous = placements.filter(p => p.riskScore >= 40);

    if (safe.length > 0) {
      // Place lowest value from safe options
      safe.sort((a, b) => window.getPointValue(a.card) - window.getPointValue(b.card));
      return { action: 'place', handCard: safe[0].card };
    }

    // All dangerous: pick least dangerous
    dangerous.sort((a, b) => a.riskScore - b.riskScore);
    return { action: 'place', handCard: dangerous[0].card };
  },

  _leavesOpponentBigger(option, hand, board) {
    // Simulate board after this capture
    const capturedIndices = new Set(option.capture.cards);
    const remainingBoard = board.filter((_, idx) => !capturedIndices.has(idx));

    // Check if any card in a hypothetical opponent hand could capture more
    // Use remaining board cards as potential "opponent hand" cards
    for (const boardCard of remainingBoard) {
      const oppCaptures = canCapture(boardCard, remainingBoard.filter(c => c.id !== boardCard.id));
      if (oppCaptures) {
        for (const opp of oppCaptures) {
          const oppTargets = opp.targets || opp.cards.map(idx => remainingBoard[idx]);
          const oppPoints = [boardCard, ...oppTargets].reduce((sum, c) => sum + window.getPointValue(c), 0);
          if (oppPoints > option.points) {
            return true;
          }
        }
      }
    }

    return false;
  },

  _isAggressive(gameState) {
    if (!gameState || !gameState.overallScores) return false;
    const botKey = gameState.currentPlayer === 1 ? 'bot1' : 'bot2';
    const myScore = gameState.overallScores[botKey] || 0;
    const maxOpponent = Math.max(
      gameState.overallScores.player || 0,
      gameState.overallScores[botKey === 'bot1' ? 'bot2' : 'bot1'] || 0
    );
    return (maxOpponent - myScore) >= 75;
  },

  _buildMove(option) {
    return {
      action: 'capture',
      handCard: option.handCard,
      capture: {
        type: option.capture.type,
        cards: option.capture.cards,
        targets: option.targets
      }
    };
  },

};

window.Nina = Nina;
