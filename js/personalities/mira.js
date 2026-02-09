/*
 * Mira "The Guardian" - Advanced Personality
 * Clone of Rex's strategy. Slow, deliberate, calm and defensive.
 * Denial-first strategy. Card counting. Opponent blocking.
 */

const Mira = {
  name: 'Mira',
  title: 'The Guardian',
  level: 'advanced',
  thinkingDelay: { min: 2000, max: 3000 },

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

    // --- Multi-area combo evaluation ---
    let bestMultiArea = null;
    for (const handCard of hand) {
      const combo = findMultiAreaCombos(handCard, board);
      if (!combo) continue;

      const allCapturedIndices = combo.areas.reduce((set, a) => {
        a.cards.forEach(idx => set.add(idx));
        return set;
      }, new Set());

      const denialValue = Mira._calculateMultiAreaDenial(allCapturedIndices, board);
      const chainPotential = Mira._calculateMultiAreaChain(handCard, allCapturedIndices, hand, board);
      const clearsBoard = allCapturedIndices.size === board.length;
      const compositeScore = Mira._compositeScore(combo.totalPoints, denialValue, chainPotential, clearsBoard, mode);

      if (!bestMultiArea || compositeScore > bestMultiArea.compositeScore) {
        bestMultiArea = { combo, compositeScore, points: combo.totalPoints, denialValue, clearsBoard };
      }
    }

    // --- Single capture evaluation ---
    let allCaptures = [];

    for (const handCard of hand) {
      const captures = canCapture(handCard, board);
      if (!captures || captures.length === 0) continue;

      for (const capture of captures) {
        const targets = capture.targets || capture.cards.map(idx => board[idx]);
        const allCards = [handCard, ...targets];
        const points = allCards.reduce((sum, c) => sum + window.getPointValue(c), 0);

        const denialValue = Mira._calculateDenial(capture, hand, board);
        const chainPotential = Mira._calculateChainPotential(handCard, capture, hand, board);
        const clearsBoard = (board.length - capture.cards.length) === 0;

        allCaptures.push({
          handCard,
          capture,
          targets,
          points,
          denialValue,
          chainPotential,
          clearsBoard,
          compositeScore: Mira._compositeScore(points, denialValue, chainPotential, clearsBoard, mode)
        });
      }
    }

    if (allCaptures.length > 0) {
      allCaptures.sort((a, b) => b.compositeScore - a.compositeScore);
    }

    // --- Compare multi-area vs single and return best ---
    if (bestMultiArea && allCaptures.length > 0) {
      if (mode === 'conservative' && bestMultiArea.points < 10 && bestMultiArea.denialValue < 15) {
        // fall through to single capture logic
      } else {
        return Mira._buildMultiAreaMove(bestMultiArea.combo);
      }
    } else if (bestMultiArea) {
      return Mira._buildMultiAreaMove(bestMultiArea.combo);
    }

    if (allCaptures.length === 0) return null;

    const best = allCaptures[0];

    if (mode === 'conservative' && best.points < 10 && best.denialValue < 15) {
      if (!best.clearsBoard && best.denialValue < 10) {
        return null;
      }
    }

    return Mira._buildMove(best);
  },

  choosePlacement(hand, board, gameState) {
    const ci = window.cardIntelligence;

    const placements = hand.map(card => {
      let score = 0;

      score -= window.getPointValue(card);

      const simulatedBoard = [...board, card];
      let maxOpponentCapture = 0;

      for (const simCard of simulatedBoard) {
        if (simCard.id === card.id) continue;
        const oppCaptures = canCapture(simCard, simulatedBoard.filter(c => c.id !== simCard.id));
        if (oppCaptures) {
          for (const opp of oppCaptures) {
            const oppTargets = opp.targets || opp.cards.map(idx => {
              const filtered = simulatedBoard.filter(c => c.id !== simCard.id);
              return filtered[idx];
            });
            const oppPts = [simCard, ...oppTargets].reduce((sum, c) => sum + window.getPointValue(c), 0);
            maxOpponentCapture = Math.max(maxOpponentCapture, oppPts);
          }
        }
      }

      if (maxOpponentCapture >= 20) {
        score -= maxOpponentCapture * 3;
      } else {
        score -= maxOpponentCapture;
      }

      if (ci) {
        const risk = ci.calculateCaptureRisk(card, board);
        score -= risk.riskScore * 0.5;
      }

      const setupBonus = Mira._calculateSetupValue(card, hand, board);
      score += setupBonus;

      return { card, score, maxOpponentCapture };
    });

    placements.sort((a, b) => b.score - a.score);

    return { action: 'place', handCard: placements[0].card };
  },

  _calculateDenial(capture, hand, board) {
    const capturedIndices = new Set(capture.cards);
    let maxOpponentGain = 0;

    for (const boardCard of board) {
      if (capturedIndices.has(board.indexOf(boardCard))) continue;

      const targetBoard = board.filter((_, idx) => !capturedIndices.has(idx));
      const oppCaptures = canCapture(boardCard, targetBoard.filter(c => c.id !== boardCard.id));
      if (oppCaptures) {
        for (const opp of oppCaptures) {
          const oppTargets = opp.targets || [];
          const oppPts = [boardCard, ...oppTargets].reduce((sum, c) => sum + window.getPointValue(c), 0);
          maxOpponentGain = Math.max(maxOpponentGain, oppPts);
        }
      }
    }

    const capturedCards = capture.cards.map(idx => board[idx]);
    const capturedValue = capturedCards.reduce((sum, c) => sum + window.getPointValue(c), 0);

    return Math.max(maxOpponentGain, capturedValue * 0.5);
  },

  _calculateChainPotential(usedHandCard, capture, hand, board) {
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
      score += denial * 2;
      score += chains * 8;
      score += clearsBoard ? 25 : 0;
    } else if (mode === 'conservative') {
      score += denial * 0.5;
      score += chains * 3;
      score += clearsBoard ? 15 : 0;
    } else {
      score += denial * 1.2;
      score += chains * 5;
      score += clearsBoard ? 20 : 0;
    }

    return score;
  },

  _calculateSetupValue(cardToPlace, hand, board) {
    const remainingHand = hand.filter(c => c.id !== cardToPlace.id);
    const simulatedBoard = [...board, cardToPlace];

    let setupValue = 0;
    for (const hc of remainingHand) {
      const captures = canCapture(hc, simulatedBoard);
      if (captures) {
        for (const cap of captures) {
          const placedIdx = simulatedBoard.length - 1;
          if (cap.cards.includes(placedIdx)) {
            const targets = cap.targets || cap.cards.map(idx => simulatedBoard[idx]);
            const pts = [hc, ...targets].reduce((sum, c) => sum + window.getPointValue(c), 0);
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

    if (maxOpponent >= 250) return 'denial';
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

  _calculateMultiAreaDenial(capturedIndices, board) {
    let maxOpponentGain = 0;
    const remainingBoard = board.filter((_, idx) => !capturedIndices.has(idx));
    for (const boardCard of remainingBoard) {
      const oppCaptures = canCapture(boardCard, remainingBoard.filter(c => c.id !== boardCard.id));
      if (oppCaptures) {
        for (const opp of oppCaptures) {
          const oppTargets = opp.targets || [];
          const oppPts = [boardCard, ...oppTargets].reduce((sum, c) => sum + window.getPointValue(c), 0);
          maxOpponentGain = Math.max(maxOpponentGain, oppPts);
        }
      }
    }
    const capturedValue = [...capturedIndices].reduce((sum, idx) => sum + window.getPointValue(board[idx]), 0);
    return Math.max(maxOpponentGain, capturedValue * 0.5);
  },

  _calculateMultiAreaChain(usedHandCard, capturedIndices, hand, board) {
    const remainingHand = hand.filter(c => c.id !== usedHandCard.id);
    const remainingBoard = board.filter((_, idx) => !capturedIndices.has(idx));
    let chainCount = 0;
    for (const hc of remainingHand) {
      const moreCaptures = canCapture(hc, remainingBoard);
      if (moreCaptures && moreCaptures.length > 0) chainCount++;
    }
    return chainCount;
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

window.Mira = Mira;
