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

function canCapture(handCard, board) {
  const captures = [];
  const handValue = valueMap[handCard.value] || parseInt(handCard.value);
  const isFaceCard = ['J', 'Q', 'K'].includes(handCard.value);

  // Pair capture
  board.forEach((card, index) => {
    if (card.value === handCard.value) {
      captures.push({ type: 'pair', cards: [index], target: card });
    }
  });

  // Sum capture (exclude J, Q, K)
  if (!isFaceCard) {
    for (let i = 0; i < board.length; i++) {
      for (let j = i + 1; j < board.length; j++) {
        // Skip if either board card is J, Q, K
        if (['J', 'Q', 'K'].includes(board[i].value) || ['J', 'Q', 'K'].includes(board[j].value)) continue;

        const sum = (valueMap[board[i].value] || parseInt(board[i].value)) + 
                    (valueMap[board[j].value] || parseInt(board[j].value));
        const targetIndex = board.findIndex((card, idx) => 
          idx !== i && idx !== j && (valueMap[card.value] || parseInt(card.value)) === sum
        );
        if (targetIndex !== -1 && sum === handValue) {
          captures.push({ type: 'sum', cards: [i, j], target: board[targetIndex] });
        }
      }
    }
  }

  return captures;
}

function scoreCards(cards) {
  return cards.reduce((total, card) => total + (pointsMap[card.value] || 0), 0);
}