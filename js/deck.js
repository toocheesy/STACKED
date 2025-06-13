// deck.js - Fully modular with exports
const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function createDeck() {
  return suits.flatMap(suit => values.map(value => ({
    suit,
    value,
    id: `${value}-${suit}`,
  })));
}

export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck, numPlayers = 3, cardsPerPlayer = 4, boardCards = 4) {
  const players = Array(numPlayers).fill().map(() => []);
  const board = [];
  let deckCopy = [...deck];

  for (let i = 0; i < cardsPerPlayer; i++) {
    for (let j = 0; j < numPlayers; j++) {
      players[j].push(deckCopy.shift());
    }
  }

  for (let i = 0; i < boardCards; i++) {
    board.push(deckCopy.shift());
  }

  return { players, board, remainingDeck: deckCopy };
}