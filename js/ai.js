
/* 
 * Updated AI to support dual play areas:
 * - AI now places target card in Principal Match and summing cards in Play Area.
 */
function aiMove(hand, board, difficulty = 'intermediate') {
  function validateCombo(handCard, boardIndices, principalValue) {
    const captures = canCapture(handCard, board);
    let selectedCapture = null;
    let capturedCards = [];

    const isFaceCard = ['J', 'Q', 'K'].includes(handCard.value);
    if (isFaceCard) {
      const matchingIndices = boardIndices.filter(idx => board[idx].value === handCard.value);
      if (matchingIndices.length > 0 && principalValue === handCard.value) {
        capturedCards = matchingIndices.map(idx => board[idx]);
        return { type: 'pair', cards: matchingIndices, targets: capturedCards };
      }
      return null;
    } else {
      if (boardIndices.length === 1) {
        selectedCapture = captures.find(cap => 
          cap.type === 'pair' && boardIndices.includes(cap.cards[0])
        );
      } else if (boardIndices.length >= 1) {
        const handValue = parseInt(handCard.value) || valueMap[handCard.value];
        const boardValues = boardIndices.map(idx => parseInt(board[idx].value) || valueMap[board[idx].value]);
        const totalSum = boardValues.reduce((a, b) => a + b, 0) + handValue;
        if (totalSum === principalValue) {
          selectedCapture = { type: 'sum', cards: boardIndices, target: board.find(card => 
            (parseInt(card.value) || valueMap[card.value]) === principalValue
          )};
        }
      }

      if (selectedCapture) {
        capturedCards = [selectedCapture.target];
        return { type: selectedCapture.type, cards: selectedCapture.cards, targets: capturedCards };
      }
      return null;
    }
  }

  function calculateCaptureScore(capture) {
    if (!capture || !capture.targets) return 0;
    return capture.targets.reduce((total, card) => total + (pointsMap[card.value] || 0), 0);
  }

  if (difficulty === 'beginner') {
    if (Math.random() < 0.5 || hand.length === 0) {
      const handCard = hand[Math.floor(Math.random() * hand.length)];
      return { action: 'place', handCard };
    }
  }

  const possibleCaptures = [];
  for (const handCard of hand) {
    const captures = canCapture(handCard, board);
    const isFaceCard = ['J', 'Q', 'K'].includes(handCard.value);

    if (isFaceCard) {
      const matchingIndices = board
        .map((card, idx) => ({ card, idx }))
        .filter(({ card }) => card.value === handCard.value)
        .map(({ idx }) => idx);
      if (matchingIndices.length > 0) {
        possibleCaptures.push({ handCard, capture: { type: 'pair', cards: matchingIndices, targets: matchingIndices.map(idx => board[idx]) } });
      }
    } else {
      for (const capture of captures) {
        const boardIndices = [capture.cards[0]]; // Use one board card for sum
        const principalCandidates = board.filter((_, i) => !boardIndices.includes(i));
        for (let principal of principalCandidates) {
          const principalValue = parseInt(principal.value) || valueMap[principal.value];
          const selectedCapture = validateCombo(handCard, boardIndices, principalValue);
          if (selectedCapture) {
            possibleCaptures.push({ handCard, capture: selectedCapture, principal });
          }
        }
      }
    }
  }

  if (possibleCaptures.length > 0) {
    if (difficulty === 'legendary') {
      possibleCaptures.sort((a, b) => calculateCaptureScore(b.capture) - calculateCaptureScore(a.capture));
      const best = possibleCaptures[0];
      return { action: 'capture', handCard: best.handCard, capture: best.capture, principal: best.principal };
    } else if (difficulty === 'intermediate') {
      const randomCapture = possibleCaptures[Math.floor(Math.random() * possibleCaptures.length)];
      return { action: 'capture', handCard: randomCapture.handCard, capture: randomCapture.capture, principal: randomCapture.principal };
    } else {
      const randomCapture = possibleCaptures[Math.floor(Math.random() * possibleCaptures.length)];
      return { action: 'capture', handCard: randomCapture.handCard, capture: randomCapture.capture, principal: randomCapture.principal };
    }
  }

  let handCard;
  if (difficulty === 'legendary') {
    hand.sort((a, b) => (pointsMap[a.value] || 0) - (pointsMap[b.value] || 0));
    handCard = hand[0];
  } else {
    handCard = hand[Math.floor(Math.random() * hand.length)];
  }
  return { action: 'place', handCard };
}