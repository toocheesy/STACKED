/*
 * Rex "The Shark" - Veteran Personality
 * Denial-first strategy. Card counting. Opponent blocking.
 * Takes captures that deny opponents, clears boards, chains.
 */

const Rex = {
  name: 'Rex',
  title: 'The Shark',
  level: 'veteran',
  thinkingDelay: { min: 1500, max: 2200 },

  decide(hand, board, gameState) {
    if (!hand || hand.length === 0) return null;
    if (!board) board = [];

    const mode = this._getMode(gameState);

    // Phase 1: Evaluate all captures with denial logic
    const capture = this.evaluateCaptures(hand, board, gameState, mode);
    if (capture) return capture;

    // Phase 2: Strategic placement
    return this.choosePlacement(hand, board, gameState);
  },

  evaluateCaptures(hand, board, gameState, mode) {
    if (board.length === 0) return null;

    let allCaptures = [];

    for (const handCard of hand) {
      const captures = canCapture(handCard, board);
      if (!captures || captures.length === 0) continue;

      for (const capture of captures) {
        const targets = capture.targets || capture.cards.map(idx => board[idx]);
        const allCards = [handCard, ...targets];
        const points = allCards.reduce((sum, c) => sum + Rex._pointValue(c), 0);

        // Calculate denial value: what opponents lose if we take this
        const denialValue = Rex._calculateDenial(capture, hand, board);

        // Calculate chain potential: captures left after this one
        const chainPotential = Rex._calculateChainPotential(handCard, capture, hand, board);

        // Board clear bonus
        const clearsBoard = (board.length - capture.cards.length) === 0;

        allCaptures.push({
          handCard,
          capture,
          targets,
          points,
          denialValue,
          chainPotential,
          clearsBoard,
          compositeScore: Rex._compositeScore(points, denialValue, chainPotential, clearsBoard, mode)
        });
      }
    }

    if (allCaptures.length === 0) return null;

    // Sort by composite score
    allCaptures.sort((a, b) => b.compositeScore - a.compositeScore);

    const best = allCaptures[0];

    // In conservative mode, only take if worth it
    if (mode === 'conservative' && best.points < 10 && best.denialValue < 15) {
      // Still take if it denies something or clears board
      if (!best.clearsBoard && best.denialValue < 10) {
        // Check if placing is safer
        return null;
      }
    }

    return Rex._buildMove(best);
  },

  choosePlacement(hand, board, gameState) {
    const ci = window.cardIntelligence;

    // Score each card considering opponent opportunities
    const placements = hand.map(card => {
      let score = 0;

      // Base: prefer placing low-value cards
      score -= Rex._pointValue(card);

      // Check what opponents could capture if we place this
      const simulatedBoard = [...board, card];
      let maxOpponentCapture = 0;

      // Simulate opponent captures with remaining board cards as proxy
      for (const simCard of simulatedBoard) {
        if (simCard.id === card.id) continue;
        const oppCaptures = canCapture(simCard, simulatedBoard.filter(c => c.id !== simCard.id));
        if (oppCaptures) {
          for (const opp of oppCaptures) {
            const oppTargets = opp.targets || opp.cards.map(idx => {
              const filtered = simulatedBoard.filter(c => c.id !== simCard.id);
              return filtered[idx];
            });
            const oppPts = [simCard, ...oppTargets].reduce((sum, c) => sum + Rex._pointValue(c), 0);
            maxOpponentCapture = Math.max(maxOpponentCapture, oppPts);
          }
        }
      }

      // Heavy penalty for creating 20+ pt opponent opportunities
      if (maxOpponentCapture >= 20) {
        score -= maxOpponentCapture * 3;
      } else {
        score -= maxOpponentCapture;
      }

      // Use cardIntelligence risk if available
      if (ci) {
        const risk = ci.calculateCaptureRisk(card, board);
        score -= risk.riskScore * 0.5;
      }

      // Bonus: does this card set up our own next capture?
      const setupBonus = Rex._calculateSetupValue(card, hand, board);
      score += setupBonus;

      return { card, score, maxOpponentCapture };
    });

    // Sort by score (highest = best placement)
    placements.sort((a, b) => b.score - a.score);

    return { action: 'place', handCard: placements[0].card };
  },

  _calculateDenial(capture, hand, board) {
    // What could opponents capture from these board cards if we don't take them?
    const capturedIndices = new Set(capture.cards);
    let maxOpponentGain = 0;

    // Check each non-hand board card as potential opponent card
    for (const boardCard of board) {
      if (capturedIndices.has(board.indexOf(boardCard))) continue;

      const targetBoard = board.filter((_, idx) => !capturedIndices.has(idx));
      const oppCaptures = canCapture(boardCard, targetBoard.filter(c => c.id !== boardCard.id));
      if (oppCaptures) {
        for (const opp of oppCaptures) {
          const oppTargets = opp.targets || [];
          const oppPts = [boardCard, ...oppTargets].reduce((sum, c) => sum + Rex._pointValue(c), 0);
          maxOpponentGain = Math.max(maxOpponentGain, oppPts);
        }
      }
    }

    // Also check what we're removing from the board that opponents could have used
    const capturedCards = capture.cards.map(idx => board[idx]);
    const capturedValue = capturedCards.reduce((sum, c) => sum + Rex._pointValue(c), 0);

    return Math.max(maxOpponentGain, capturedValue * 0.5);
  },

  _calculateChainPotential(usedHandCard, capture, hand, board) {
    // After this capture, how many more captures could we make?
    const remainingHand = hand.filter(c => c.id !== usedHandCard.id);
    const capturedIndices = new Set(capture.cards);
    const remainingBoard = board.filter((_, idx) => !capturedIndices.has(idx));

    let chainCount = 0;
    for (const hc of remainingHand) {
      const moreCaptures = canCapture(hc, remainingBoard);
      if (moreCaptures && moreCaptures.length > 0) {
        chainCount++;
      }
    }

    return chainCount;
  },

  _compositeScore(points, denial, chains, clearsBoard, mode) {
    let score = points;

    if (mode === 'denial') {
      // Denial mode: blocking is worth more than scoring
      score += denial * 2;
      score += chains * 8;
      score += clearsBoard ? 25 : 0;
    } else if (mode === 'conservative') {
      // Conservative: prefer safe, guaranteed points
      score += denial * 0.5;
      score += chains * 3;
      score += clearsBoard ? 15 : 0;
    } else {
      // Normal: balanced approach
      score += denial * 1.2;
      score += chains * 5;
      score += clearsBoard ? 20 : 0;
    }

    return score;
  },

  _calculateSetupValue(cardToPlace, hand, board) {
    // Would placing this card create a capture opportunity for us next turn?
    const remainingHand = hand.filter(c => c.id !== cardToPlace.id);
    const simulatedBoard = [...board, cardToPlace];

    let setupValue = 0;
    for (const hc of remainingHand) {
      const captures = canCapture(hc, simulatedBoard);
      if (captures) {
        for (const cap of captures) {
          // Check if the placed card is part of the capture
          const placedIdx = simulatedBoard.length - 1;
          if (cap.cards.includes(placedIdx)) {
            const targets = cap.targets || cap.cards.map(idx => simulatedBoard[idx]);
            const pts = [hc, ...targets].reduce((sum, c) => sum + Rex._pointValue(c), 0);
            setupValue = Math.max(setupValue, pts * 0.3);
          }
        }
      }
    }

    return setupValue;
  },

  _getMode(gameState) {
    if (!gameState || !gameState.overallScores) return 'normal';

    const botKey = gameState.currentPlayer === 1 ? 'bot1' : 'bot2';
    const myScore = gameState.overallScores[botKey] || 0;
    const opponentScores = [
      gameState.overallScores.player || 0,
      gameState.overallScores[botKey === 'bot1' ? 'bot2' : 'bot1'] || 0
    ];
    const maxOpponent = Math.max(...opponentScores);

    // Opponent near 300: denial mode
    if (maxOpponent >= 250) return 'denial';

    // Rex leads by 100+: conservative
    if ((myScore - maxOpponent) >= 100) return 'conservative';

    return 'normal';
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

  _pointValue(card) {
    if (!card) return 0;
    const map = { 'A': 15, 'K': 10, 'Q': 10, 'J': 10, '10': 10 };
    return map[card.value] || 5;
  }
};

window.Rex = Rex;
