// STACKED! Shared Constants
// Single source of truth - all other files import from here

const POINTS_MAP = {
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

const PLAYER_NAMES = ['Player', 'Bot 1', 'Bot 2'];

function calculateScore(cards) {
  return cards.reduce((total, card) => total + (POINTS_MAP[card.value] || 0), 0);
}

// For personality files
function getPointValue(card) {
  return POINTS_MAP[card.value] || 0;
}

// Export for use everywhere
window.POINTS_MAP = POINTS_MAP;
window.PLAYER_NAMES = PLAYER_NAMES;
window.calculateScore = calculateScore;
window.getPointValue = getPointValue;
