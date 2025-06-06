function aiMove(hand, board, difficulty = 'intermediate') {
  // Helper function to simulate a combo and validate it
  function validateCombo(handCard, selectedBoardIndices) {
    const captures = canCapture(handCard, board);
    let selectedCapture = null;
    let capturedCards = [];

    const isFaceCard = ['J', 'Q', 'K'].includes(handCard.value);
    if (isFaceCard) {
      // For J, Q, K, capture all matching cards
      const matchingIndices = selectedBoardIndices.filter(idx => board[idx].value === handCard.value);
      if (matchingIndices.length > 0) {
        capturedCards = matchingIndices.map(idx => board[idx]);
        return { type: 'pair', cards: matchingIndices, targets: capturedCards };
      }
      return null;
    } else {
      if (selectedBoardIndices.length === 1) {
        // Pair capture
        selectedCapture = captures.find(cap => 
          cap.type === 'pair' && selectedBoardIndices.includes(cap.cards[0])
        );
      } else if (selectedBoardIndices.length >= 2) {
        // Sum capture: Find a pair of board indices that sum to a valid target
        for (let i = 0; i < selectedBoardIndices.length; i++) {
          for (let j = i + 1; j < selectedBoardIndices.length; j++) {
            const pairIndices = [selectedBoardIndices[i], selectedBoardIndices[j]];
            selectedCapture = captures.find(cap => {
              if (cap.type === 'sum') {
                const capIndices = cap.cards;
                return capIndices.length === 2 && 
                       capIndices.every(idx => pairIndices.includes(idx)) && 
                       capIndices.sort().join(',') === pairIndices.sort().join(',');
              }
              return false;
            });
            if (selectedCapture) break;
          }
          if (selectedCapture) break;
        }
      }

      if (selectedCapture) {
        capturedCards = [selectedCapture.target];
        return { type: selectedCapture.type, cards: selectedCapture.cards, targets: capturedCards };
      }
      return null;
    }
  }

  // Helper function to calculate the score of a capture
  function calculateCaptureScore(capture) {
    if (!capture || !capture.targets) return 0;
    return capture.targets.reduce((total, card) => total + (pointsMap[card.value] || 0), 0);
  }

  // Bot behavior based on difficulty
  if (difficulty === 'beginner') {
    // Beginner: 50% chance to place a card even if a capture is possible
    if (Math.random() < 0.5 || hand.length === 0) {
      const handCard = hand[Math.floor(Math.random() * hand.length)];
      return { action: 'place', handCard };
    }
  }

  // Find all possible captures
  const possibleCaptures = [];
  for (const handCard of hand) {
    const captures = canCapture(handCard, board);
    const isFaceCard = ['J', 'Q', 'K'].includes(handCard.value);

    if (isFaceCard) {
      // For J, Q, K, find all matching cards on the board
      const matchingIndices = board
        .map((card, idx) => ({ card, idx }))
        .filter(({ card }) => card.value === handCard.value)
        .map(({ idx }) => idx);
      if (matchingIndices.length > 0) {
        const capture = validateCombo(handCard, matchingIndices);
        if (capture) {
          possibleCaptures.push({ handCard, capture });
        }
      }
    } else {
      for (const capture of captures) {
        const boardIndices = capture.cards; // Indices used in the capture
        const selectedCapture = validateCombo(handCard, boardIndices);
        if (selectedCapture) {
          possibleCaptures.push({ handCard, capture: selectedCapture });
        }
      }
    }
  }

  if (possibleCaptures.length > 0) {
    if (difficulty === 'legendary') {
      // Legendary: Pick the highest-scoring capture
      possibleCaptures.sort((a, b) => calculateCaptureScore(b.capture) - calculateCaptureScore(a.capture));
      return { action: 'capture', handCard: possibleCaptures[0].handCard, capture: possibleCaptures[0].capture };
    } else if (difficulty === 'intermediate') {
      // Intermediate: Pick a random capture (not necessarily the best)
      const randomCapture = possibleCaptures[Math.floor(Math.random() * possibleCaptures.length)];
      return { action: 'capture', handCard: randomCapture.handCard, capture: randomCapture.capture };
    } else {
      // Beginner: Pick a random capture (already filtered for 50% chance)
      const randomCapture = possibleCaptures[Math.floor(Math.random() * possibleCaptures.length)];
      return { action: 'capture', handCard: randomCapture.handCard, capture: randomCapture.capture };
    }
  }

  // No valid captures: place a card
  let handCard;
  if (difficulty === 'legendary') {
    // Legendary: Place the lowest-value card (minimize points given to others)
    hand.sort((a, b) => (pointsMap[a.value] || 0) - (pointsMap[b.value] || 0));
    handCard = hand[0];
  } else {
    // Beginner/Intermediate: Random card
    handCard = hand[Math.floor(Math.random() * hand.length)];
  }
  return { action: 'place', handCard };
}