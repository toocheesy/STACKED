// ai.js - Simplified to one beginner AI
export function setupAI({ difficulty }) {
  if (difficulty !== 'beginner') throw new Error('Only beginner mode supported for now');

  function makeMove(state) {
    const { playerHand, board } = state;
    // Simple logic: match any card on board with hand if possible
    const move = board.find(card => playerHand.some(handCard => handCard.value === card.value));
    return move ? { type: 'capture', card: move } : { type: 'place', card: playerHand[0] };
  }

  return { makeMove };
}