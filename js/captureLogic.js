// captureLogic.js - Handles validation and scoring logic
export function isValidCombo(slot0Cards, slot1Cards) {
  if (slot0Cards.length === 0 || slot1Cards.length !== 1) return false;
  const hasHandCard = slot0Cards.some(entry => entry.source === 'hand') || slot1Cards[0].source === 'hand';
  const hasBoardCard = slot0Cards.some(entry => entry.source === 'board') || slot1Cards[0].source === 'board';
  if (!hasHandCard || !hasBoardCard) return false;

  const principal = slot1Cards[0].card;
  const principalValue = parseInt(principal.value) || (window.valueMap && window.valueMap[principal.value]) || 1;
  const sum = slot0Cards.reduce((total, entry) => {
    const val = parseInt(entry.card.value) || (window.valueMap && window.valueMap[entry.card.value]) || 1;
    return total + val;
  }, 0);

  if (sum === principalValue) return true;
  if (slot0Cards.length === 1 && slot0Cards[0].card.value === principal.value) return true;
  return false;
}

export function getCapturedCards(slot0Cards, slot1Cards) {
  return [...slot0Cards.map(entry => entry.card), ...slot1Cards.map(entry => entry.card)];
}

export function calculateScore(cards) {
  return cards.reduce((total, card) => total + (window.pointsMap && window.pointsMap[card.value] || 0), 0);
}

export function canCapture(handCard, board) {
  const captures = [];
  const handValue = (window.valueMap && window.valueMap[handCard.value]) || parseInt(handCard.value) || 1;
  board.forEach((card, i) => {
    if (card.value === handCard.value) {
      captures.push({ type: 'pair', cards: [i], target: card });
    }
  });
  return captures;
}