// turnManager.js
import { isValidCombo, getCapturedCards, calculateScore } from './captureLogic.js';
import { debugLog } from './debug.js';

export function manageTurn(state) {
  debugLog('Checking for turn end...', state.hands);
  const playersWithCards = state.hands.filter(hand => hand.length > 0).length;
  if (playersWithCards === 0) {
    const adaptedPlayers = state.hands.map(hand => ({ hand: hand }));
    if (state.deck.length > 0 && !dealAfterBots(adaptedPlayers, state.deck)) {
      for (let i = 0; i < state.hands.length; i++) {
        state.hands[i] = adaptedPlayers[i].hand;
      }
      state.currentPlayer = 0;
    } else {
      endGame(state);
    }
  }
}

export function endGame(state) {
  const scores = [
    { name: 'Player', score: state.scores.player },
    { name: 'Bot 1', score: state.scores.bot1 },
    { name: 'Bot 2', score: state.scores.bot2 }
  ];
  const winner = scores.reduce((max, p) => p.score > max.score ? p : max, { score: -1 });
  debugLog(`${winner.name} wins with ${winner.score} points!`);
  const messageEl = document.getElementById('message');
  if (messageEl) messageEl.textContent = `${winner.name} wins with ${winner.score} points! Restart to play again.`;
  const sound = window.sounds?.gameEnd;
  if (sound && state.settings.soundEffects === 'on') sound.play();
}