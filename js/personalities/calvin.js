/*
 * Calvin "The Calculator" - Novice Personality
 * Simple point maximizer. Takes highest capture, places lowest card.
 * No board awareness, no opponent consideration, no chaining.
 */

const Calvin = {
  name: 'Calvin',
  title: 'The Calculator',
  level: 'novice',
  thinkingDelay: { min: 2000, max: 3000 },

  decide(hand, board, gameState) {
    if (!hand || hand.length === 0) return null;
    if (!board) board = [];

    // Phase 1: Look for captures - take highest points available
    const capture = this.evaluateCaptures(hand, board);
    if (capture) return capture;

    // Phase 2: Place lowest point card
    return this.choosePlacement(hand, board);
  },

  evaluateCaptures(hand, board) {
    if (board.length === 0) return null;

    let bestCapture = null;
    let bestPoints = 0;
    let bestHandValue = Infinity;

    for (const handCard of hand) {
      const captures = canCapture(handCard, board);
      if (!captures || captures.length === 0) continue;

      for (const capture of captures) {
        const targets = capture.targets || capture.cards.map(idx => board[idx]);
        const allCards = [handCard, ...targets];
        const points = allCards.reduce((sum, c) => sum + window.getPointValue(c), 0);
        const handVal = Calvin._numericValue(handCard);

        // Take highest points; tiebreak: use lowest hand card value
        if (points > bestPoints || (points === bestPoints && handVal < bestHandValue)) {
          bestPoints = points;
          bestHandValue = handVal;
          bestCapture = {
            action: 'capture',
            handCard: handCard,
            capture: {
              type: capture.type,
              cards: capture.cards,
              targets: targets
            }
          };
        }
      }
    }

    return bestCapture;
  },

  choosePlacement(hand, board) {
    // Place lowest point card; tiebreak: lowest rank
    const sorted = [...hand].sort((a, b) => {
      const pointDiff = window.getPointValue(a) - window.getPointValue(b);
      if (pointDiff !== 0) return pointDiff;
      return Calvin._numericValue(a) - Calvin._numericValue(b);
    });

    return { action: 'place', handCard: sorted[0] };
  },


  _numericValue(card) {
    if (!card) return 99;
    if (card.value === 'A') return 1;
    const num = parseInt(card.value);
    if (!isNaN(num)) return num;
    return { 'J': 11, 'Q': 12, 'K': 13 }[card.value] || 99;
  }
};

window.Calvin = Calvin;
