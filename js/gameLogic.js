// REPLACE your entire gameLogic.js file with this FIXED version:

const pointsMap = {
  'A': 15,
  'K': 10,
  'Q': 10,
  'J': 10,
  '10': 10,
  '9': 5,
  '8': 5,
  '7': 5,
  '6': 5,
  '5': 5,
  '4': 5,
  '3': 5,
  '2': 5
};

const valueMap = {
  'A': 1,
  'K': 13,
  'Q': 12,
  'J': 11
};

// 🔥 COMPLETELY REWRITTEN canCapture() function with BOTH pair and sum logic
function canCapture(handCard, board) {
  const captures = [];
  const handValue = handCard.value === 'A' ? 1 : (parseInt(handCard.value) || valueMap[handCard.value]);
  const isFaceCard = ['J', 'Q', 'K'].includes(handCard.value);

  console.log(`🔍 CHECKING CAPTURES: ${handCard.value}${handCard.suit} (value=${handValue}) vs ${board.length} board cards`);

  // 🎯 PAIR CAPTURES: Find exact matches
  board.forEach((card, index) => {
    if (card.value === handCard.value) {
      captures.push({ 
        type: 'pair', 
        cards: [index], 
        target: card,
        handCard: handCard,
        score: 10 // Base score for pairs
      });
      console.log(`✅ PAIR FOUND: ${handCard.value}${handCard.suit} matches ${card.value}${card.suit} at index ${index}`);
    }
  });

  // 🎯 SUM CAPTURES: Only for number cards and Aces (NOT face cards)
  if (!isFaceCard && !isNaN(handValue)) {
    console.log(`🔍 CHECKING SUM CAPTURES for ${handCard.value} (value=${handValue})`);
    
    // Find all possible combinations that sum to handValue
    const boardNumerics = board.map((card, idx) => {
      const cardValue = card.value === 'A' ? 1 : parseInt(card.value);
      return {
        value: isNaN(cardValue) ? null : cardValue, // Face cards return null
        idx: idx,
        card: card
      };
    }).filter(item => item.value !== null); // Only include number cards and Aces
    
    console.log(`🔍 Board numerics:`, boardNumerics.map(item => `${item.card.value}(${item.value})`));
    
    // Check single card sums (most common)
    boardNumerics.forEach(boardItem => {
      if (boardItem.value === handValue) {
        captures.push({
          type: 'sum',
          cards: [boardItem.idx],
          targets: [boardItem.card],
          handCard: handCard,
          score: 8 // Sum captures worth slightly less than pairs
        });
        console.log(`✅ SUM FOUND: ${handCard.value}(${handValue}) = ${boardItem.card.value}(${boardItem.value})`);
      }
    });
    
    // Check two-card sums (like 2+3=5)
    for (let i = 0; i < boardNumerics.length; i++) {
      for (let j = i + 1; j < boardNumerics.length; j++) {
        const sum = boardNumerics[i].value + boardNumerics[j].value;
        if (sum === handValue) {
          captures.push({
            type: 'sum',
            cards: [boardNumerics[i].idx, boardNumerics[j].idx],
            targets: [boardNumerics[i].card, boardNumerics[j].card],
            handCard: handCard,
            score: 12 // Multi-card sums worth more
          });
          console.log(`✅ TWO-CARD SUM: ${handCard.value}(${handValue}) = ${boardNumerics[i].card.value}(${boardNumerics[i].value}) + ${boardNumerics[j].card.value}(${boardNumerics[j].value})`);
        }
      }
    }
    
    // Check three-card sums (like 1+2+2=5)
    for (let i = 0; i < boardNumerics.length; i++) {
      for (let j = i + 1; j < boardNumerics.length; j++) {
        for (let k = j + 1; k < boardNumerics.length; k++) {
          const sum = boardNumerics[i].value + boardNumerics[j].value + boardNumerics[k].value;
          if (sum === handValue) {
            captures.push({
              type: 'sum',
              cards: [boardNumerics[i].idx, boardNumerics[j].idx, boardNumerics[k].idx],
              targets: [boardNumerics[i].card, boardNumerics[j].card, boardNumerics[k].card],
              handCard: handCard,
              score: 15 // Three-card sums worth most
            });
            console.log(`✅ THREE-CARD SUM: ${handCard.value}(${handValue}) = ${boardNumerics[i].card.value} + ${boardNumerics[j].card.value} + ${boardNumerics[k].card.value}`);
          }
        }
      }
    }
  }

  console.log(`🎯 TOTAL CAPTURES FOUND: ${captures.length} for ${handCard.value}${handCard.suit}`);
  return captures;
}

function scoreCards(cards) {
  return cards.reduce((total, card) => total + (pointsMap[card.value] || 0), 0);
}