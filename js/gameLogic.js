// js/gameLogic.js
const cardValueMap = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 1,
};

const pointsMap = {
  '2': 5, '3': 5, '4': 5, '5': 5, '6': 5, '7': 5, '8': 5, '9': 5,
  '10': 10, 'J': 10, 'Q': 10, 'K': 10, 'A': 15,
};

function canCapture(handCard, boardCards) {
  const handValue = cardValueMap[handCard.value];
  const captures = [];

  boardCards.forEach((boardCard, i) => {
    if (boardCard.value === handCard.value) {
      captures.push({ type: 'pair', cards: [i], target: boardCard });
    }
  });

  for (let i = 0; i < boardCards.length; i++) {
    for (let j = 0; j < boardCards.length; j++) {
      if (i !== j) {
        const sum = handValue + cardValueMap[boardCards[i].value];
        const target = boardCards.find((c, k) => k !== i && cardValueMap[c.value] === sum);
        if (target) {
          captures.push({ type: 'sum', cards: [i, boardCards.indexOf(target)], target });
        }
      }
    }
  }

  return captures;
}

function scoreCards(capturedCards) {
  return capturedCards.reduce((score, card) => score + pointsMap[card.value], 0);
}