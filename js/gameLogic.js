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

  board.forEach((card, index) => {
    if (card.value === handCard.value) {
      captures.push({ type: 'pair', cards: [index], target: card });
    }
  });

  return captures;
}

function scoreCards(cards) {
  return cards.reduce((total, card) => total + (pointsMap[card.value] || 0), 0);
}