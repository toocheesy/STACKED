/*
 * Talia "The Teacher" - Intermediate Personality
 * Clone of Nina's strategy. Patient, encouraging, teaching-focused.
 * Weighs capture value against what it leaves for opponents.
 * Avoids dangerous placements. Goes aggressive when behind.
 */

const Talia = {
  name: 'Talia',
  title: 'The Teacher',
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

    // --- Multi-area combo check ---
    let bestCombo = null;
    for (const handCard of hand) {
      const combo = findMultiAreaCombos(handCard, board);
      if (!combo) continue;
      if (!bestCombo || combo.totalPoints > bestCombo.totalPoints) {
        bestCombo = combo;
      }
    }

    if (bestCombo) {
      if (bestCombo.totalPoints >= 30) {
        return Talia._buildMultiAreaMove(bestCombo);
      }
      if (aggressive && bestCombo.totalPoints >= 20) {
        return Talia._buildMultiAreaMove(bestCombo);
      }
    }

    // --- Single-capture logic ---
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

    allCaptures.sort((a, b) => b.points - a.points);

    for (const option of allCaptures) {
      if (option.points >= 25) {
        return Talia._buildMove(option);
      }
      if (aggressive && option.points >= 10) {
        return Talia._buildMove(option);
      }
      if (option.points >= 15) {
        const leavesOpportunity = Talia._leavesOpponentBigger(option, hand, board);
        if (!leavesOpportunity) {
          return Talia._buildMove(option);
        }
        continue;
      }
      const allLowValue = allCaptures.every(c => c.points < 15);
      if (allLowValue) {
        return Talia._buildMove(allCaptures[0]);
      }
    }

    return Talia._buildMove(allCaptures[0]);
  },

  choosePlacement(hand, board) {
    const ci = window.cardIntelligence;

    if (!ci) {
      const sorted = [...hand].sort((a, b) => window.getPointValue(a) - window.getPointValue(b));
      return { action: 'place', handCard: sorted[0] };
    }

    const placements = hand.map(card => {
      const risk = ci.calculateCaptureRisk(card, board);
      return { card, riskScore: risk.riskScore };
    });

    const safe = placements.filter(p => p.riskScore < 40);
    const dangerous = placements.filter(p => p.riskScore >= 40);

    if (safe.length > 0) {
      safe.sort((a, b) => window.getPointValue(a.card) - window.getPointValue(b.card));
      return { action: 'place', handCard: safe[0].card };
    }

    dangerous.sort((a, b) => a.riskScore - b.riskScore);
    return { action: 'place', handCard: dangerous[0].card };
  },

  _leavesOpponentBigger(option, hand, board) {
    const capturedIndices = new Set(option.capture.cards);
    const remainingBoard = board.filter((_, idx) => !capturedIndices.has(idx));

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

  _buildMultiAreaMove(combo) {
    return {
      action: 'capture',
      handCard: combo.handCard,
      areas: combo.areas,
      allTargets: combo.allTargets,
      totalPoints: combo.totalPoints
    };
  },

};

window.Talia = Talia;
