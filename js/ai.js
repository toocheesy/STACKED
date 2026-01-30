/*
 * AI Move Router
 * Thin dispatcher that delegates to personality modules.
 */

const personalities = {
  calvin: () => window.Calvin,
  nina: () => window.Nina,
  rex: () => window.Rex
};

function getPersonality(name) {
  const getter = personalities[name];
  if (getter) {
    const p = getter();
    if (p) return p;
  }
  // Fallback to Nina if personality not found
  console.warn('Personality not found:', name, '- falling back to Nina');
  return window.Nina;
}

function getThinkingDelay(personalityName) {
  const bot = getPersonality(personalityName);
  const min = bot.thinkingDelay.min;
  const max = bot.thinkingDelay.max;
  return min + Math.random() * (max - min);
}

function aiMove(hand, board, personalityName, gameState) {
  if (!hand || hand.length === 0) return null;
  if (!board) board = [];

  const bot = getPersonality(personalityName);
  return bot.decide(hand, board, gameState || {});
}
