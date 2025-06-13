// captureLogic.js
export function isValidCombo(slot0Cards, slot1Cards) {
  if (slot0Cards.length === 0 || slot1Cards.length !== 1) return false;
  const hasHandCard = slot0Cards.some(entry => entry.source === 'hand') || slot1Cards[0].source === 'hand';
  const hasBoardCard = slot0Cards.some(entry => entry.source === 'board') || slot1Cards[0].source === 'board';
  if (!hasHandCard || !hasBoardCard) return false;

  const principal = slot1Cards[0].card;
  const principalValue = parseInt(principal.value) || window.valueMap[principal.value];
  const sum = slot0Cards.reduce((total, entry) => {
    const val = parseInt(entry.card.value) || window.valueMap[entry.card.value];
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
  return cards.reduce((total, card) => total + (window.pointsMap[card.value] || 0), 0);
}
