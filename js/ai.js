/* 
 * Updated AI for 5-area system with better difficulty scaling
 */
function aiMove(hand, board, difficulty = 'intermediate') {
  console.log(`🎯 AI MOVE CALLED: Difficulty=${difficulty}, Hand=${hand.length}, Board=${board.length}`);
  
  // BEGINNER: 80% chance to just place a random card
  if (difficulty === 'beginner') {
    if (Math.random() < 0.8 || hand.length === 0) {
      const handCard = hand[Math.floor(Math.random() * hand.length)];
      console.log(`🎯 BEGINNER: Placing random card ${handCard?.value}${handCard?.suit}`);
      return { action: 'place', handCard };
    }
  }
  
  // INTERMEDIATE: 50% chance to try captures
  if (difficulty === 'intermediate') {
    if (Math.random() < 0.5 || hand.length === 0) {
      const handCard = hand[Math.floor(Math.random() * hand.length)];
      console.log(`🎯 INTERMEDIATE: 50/50 - Placing card ${handCard?.value}${handCard?.suit}`);
      return { action: 'place', handCard };
    }
  }

  // Look for captures (INTERMEDIATE and LEGENDARY)
  const possibleCaptures = [];
  
  for (const handCard of hand) {
    const captures = canCapture(handCard, board);
    
    // Simple pair captures (face cards)
    const isFaceCard = ['J', 'Q', 'K'].includes(handCard.value);
    if (isFaceCard) {
      const matchingIndices = board
        .map((card, idx) => ({ card, idx }))
        .filter(({ card }) => card.value === handCard.value)
        .map(({ idx }) => idx);
        
      if (matchingIndices.length > 0) {
        possibleCaptures.push({ 
          handCard, 
          capture: { 
            type: 'pair', 
            cards: matchingIndices, 
            targets: matchingIndices.map(idx => board[idx]) 
          },
          score: matchingIndices.length * 10 // Face cards worth more
        });
      }
    } else {
      // Sum captures (number cards)
      for (const capture of captures) {
        if (capture.type === 'pair') {
          // Simple pair for number cards
          possibleCaptures.push({
            handCard,
            capture: {
              type: 'pair',
              cards: capture.cards,
              targets: capture.cards.map(idx => board[idx])
            },
            score: capture.cards.length * 5
          });
        } else if (capture.type === 'sum') {
          // Sum capture
          possibleCaptures.push({
            handCard,
            capture: {
              type: 'sum', 
              cards: capture.cards,
              targets: capture.cards.map(idx => board[idx])
            },
            score: capture.cards.length * 5
          });
        }
      }
    }
  }

  if (possibleCaptures.length > 0) {
    let selectedCapture;
    
    if (difficulty === 'legendary') {
      // LEGENDARY: Always pick the best scoring capture
      possibleCaptures.sort((a, b) => b.score - a.score);
      selectedCapture = possibleCaptures[0];
      console.log(`🎯 LEGENDARY: Best capture ${selectedCapture.handCard.value}${selectedCapture.handCard.suit} (${selectedCapture.score} pts)`);
    } else {
      // INTERMEDIATE: Random capture
      selectedCapture = possibleCaptures[Math.floor(Math.random() * possibleCaptures.length)];
      console.log(`🎯 INTERMEDIATE: Random capture ${selectedCapture.handCard.value}${selectedCapture.handCard.suit}`);
    }
    
    return { 
      action: 'capture', 
      handCard: selectedCapture.handCard, 
      capture: selectedCapture.capture 
    };
  }

  // No captures available - place a card
  let handCard;
  if (difficulty === 'legendary') {
    // LEGENDARY: Place lowest value card
    hand.sort((a, b) => {
      const aVal = parseInt(a.value) || (a.value === 'A' ? 1 : 10);
      const bVal = parseInt(b.value) || (b.value === 'A' ? 1 : 10);
      return aVal - bVal;
    });
    handCard = hand[0];
    console.log(`🎯 LEGENDARY: Placing lowest card ${handCard.value}${handCard.suit}`);
  } else {
    // BEGINNER/INTERMEDIATE: Random card
    handCard = hand[Math.floor(Math.random() * hand.length)];
    console.log(`🎯 ${difficulty.toUpperCase()}: Placing random card ${handCard.value}${handCard.suit}`);
  }
  
  return { action: 'place', handCard };
}