function aiMove(hand, board, difficulty = 'intermediate') {
  const safeCanCapture = window.canCapture || function(handCard, board) { return []; };
  const safeValueMap = window.valueMap || { 'A': 1, 'K': 13, 'Q': 12, 'J': 11 };
  const safePointsMap = window.pointsMap || { 'A': 15, 'K': 10, 'Q': 10, 'J': 10, '10': 10 };

  if (!hand || hand.length === 0) {
    return { action: 'place', handCard: null };
  }

  if (difficulty === 'beginner' && Math.random() < 0.5) {
    const handCard = hand[Math.floor(Math.random() * hand.length)];
    return { action: 'place', handCard };
  }

  const possibleCaptures = [];

  for (const handCard of hand) {
    if (!handCard || !handCard.value) continue;

    const captures = safeCanCapture(handCard, board);
    const isFaceCard = ['J', 'Q', 'K'].includes(handCard.value);

    if (isFaceCard) {
      const matchingCards = board.filter(card => card && card.value === handCard.value);
      if (matchingCards.length > 0) {
        const score = matchingCards.length * (safePointsMap[handCard.value] || 10);
        possibleCaptures.push({ 
          handCard, 
          score, 
          type: 'pair',
          matchingCards 
        });
      }
    } else {
      const pairMatches = board.filter(card => card && card.value === handCard.value);
      if (pairMatches.length > 0) {
        const score = pairMatches.length * (safePointsMap[handCard.value] || 5);
        possibleCaptures.push({ 
          handCard, 
          score, 
          type: 'pair',
          matchingCards: pairMatches 
        });
      }

      const handValue = parseInt(handCard.value) || safeValueMap[handCard.value] || 1;
      for (let i = 0; i < board.length; i++) {
        const targetCard = board[i];
        if (!targetCard || ['J', 'Q', 'K'].includes(targetCard.value)) continue;
        const targetValue = parseInt(targetCard.value) || safeValueMap[targetCard.value] || 1;
        for (let j = 0; j < board.length; j++) {
          if (i === j) continue;
          const sumCard = board[j];
          if (!sumCard || ['J', 'Q', 'K'].includes(sumCard.value)) continue;
          const sumValue = parseInt(sumCard.value) || safeValueMap[sumCard.value] || 1;
          if (handValue + sumValue === targetValue) {
            const score = (safePointsMap[handCard.value] || 5) + 
                         (safePointsMap[sumCard.value] || 5) + 
                         (safePointsMap[targetCard.value] || 5);
            possibleCaptures.push({ 
              handCard, 
              score, 
              type: 'sum',
              targetCard,
              sumCard 
            });
          }
        }
      }
    }
  }

  if (possibleCaptures.length > 0) {
    let chosenCapture;
    if (difficulty === 'legendary') {
      possibleCaptures.sort((a, b) => b.score - a.score);
      chosenCapture = possibleCaptures[0];
    } else {
      chosenCapture = possibleCaptures[Math.floor(Math.random() * possibleCaptures.length)];
    }
    return { 
      action: 'capture', 
      handCard: chosenCapture.handCard,
      captureType: chosenCapture.type,
      targetCards: chosenCapture.matchingCards || [chosenCapture.targetCard, chosenCapture.sumCard].filter(Boolean)
    };
  }

  // No captures possible, place a card
  let handCard;
  if (difficulty === 'legendary') {
    hand.sort((a, b) => (safePointsMap[a.value] || 0) - (safePointsMap[b.value] || 0));
    handCard = hand[0];
  } else {
    handCard = hand[Math.floor(Math.random() * hand.length)];
  }
  return { action: 'place', handCard };
}

window.aiMove = aiMove;