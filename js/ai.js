// js/ai.js
function aiMove(hand, board) {
  for (const handCard of hand) {
    const captures = canCapture(handCard, board);
    if (captures.length > 0) {
      const capture = captures[Math.floor(Math.random() * captures.length)];
      return { action: 'capture', handCard, capture };
    }
  }
  const handCard = hand[Math.floor(Math.random() * hand.length)];
  return { action: 'place', handCard };
}