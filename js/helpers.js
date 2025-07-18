// helpers.js
// Merged deck.js, gameLogic.js, and utils.js

// ————— Deck & Dealing Utilities —————
export const suits  = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
export const values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

export function createDeck() {
  return suits.flatMap(suit =>
    values.map(value => ({ suit, value, id: `${value}-${suit}` }))
  );
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
  const players  = Array.from({ length: numPlayers }, () => []);
  const board    = [];
  const deckCopy = [...deck];

  for (let i = 0; i < cardsPerPlayer; i++) {
    for (let p = 0; p < numPlayers; p++) {
      players[p].push(deckCopy.shift());
    }
  }
  for (let i = 0; i < boardCards; i++) {
    board.push(deckCopy.shift());
  }
  return { players, board, remainingDeck: deckCopy };
}

// ————— Game Logic —————
const pointsMap = { 'A':15,'K':10,'Q':10,'J':10,'10':10,'9':5,'8':5,'7':5,'6':5,'5':5,'4':5,'3':5,'2':5 };
const valueMap  = { 'A':1, 'K':13, 'Q':12, 'J':11 };

export function canCapture(handCard, board) {
  const captures    = [];
  const handValue   = handCard.value === 'A' ? 1 : (parseInt(handCard.value) || valueMap[handCard.value]);
  const isFaceCard  = ['J','Q','K'].includes(handCard.value);

  // Pair captures
  board.forEach((card, idx) => {
    if (card.value === handCard.value) {
      captures.push({ type:'pair', cards:[idx], target:card, handCard, score:10 });
    }
  });

  // Sum captures (only non‑face cards)
  if (!isFaceCard && !isNaN(handValue)) {
    const numerics = board
      .map((card, idx) => ({ value: card.value==='A'?1:parseInt(card.value), idx, card }))
      .filter(x => !isNaN(x.value));

    // Single‑card sums
    numerics.forEach(x => {
      if (x.value === handValue) {
        captures.push({ type:'sum', cards:[x.idx], targets:[x.card], handCard, score:8 });
      }
    });
    // Multi‑card sums
    for (let i = 0; i < numerics.length; i++) {
      for (let j = i+1; j < numerics.length; j++) {
        if (numerics[i].value + numerics[j].value === handValue) {
          captures.push({
            type:'sum',
            cards:[numerics[i].idx,numerics[j].idx],
            targets:[numerics[i].card,numerics[j].card],
            handCard, score:12
          });
        }
      }
      for (let j = i+1; j < numerics.length; j++) {
        for (let k = j+1; k < numerics.length; k++) {
          if (numerics[i].value + numerics[j].value + numerics[k].value === handValue) {
            captures.push({
              type:'sum',
              cards:[numerics[i].idx,numerics[j].idx,numerics[k].idx],
              targets:[numerics[i].card,numerics[j].card,numerics[k].card],
              handCard, score:15
            });
          }
        }
      }
    }
  }

  return captures;
}

export function scoreCards(cards) {
  return cards.reduce((sum, c) => sum + (pointsMap[c.value] || 0), 0);
}

// ————— Utility & Modal Systems —————
// Draggable Modal
export class DraggableModal {
  constructor(elementId) {
    this.modal      = document.getElementById(elementId);
    this.isDragging = false;
    this.startX = this.startY = this.initialX = this.initialY = 0;
    if (this.modal) this.init();
  }
  init() {
    const title = this.modal.querySelector('.modal-title');
    if (title) title.style.cursor = 'move', title.addEventListener('mousedown', e => this.startDrag(e));
    document.addEventListener('mousemove', e => this.drag(e));
    document.addEventListener('mouseup', () => this.stopDrag());
  }
  startDrag(e) {
    this.isDragging = true;
    this.startX = e.clientX; this.startY = e.clientY;
    const rect = this.modal.getBoundingClientRect();
    this.initialX = rect.left; this.initialY = rect.top;
    this.modal.style.transition = 'none';
  }
  drag(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    const dx = e.clientX - this.startX, dy = e.clientY - this.startY;
    const nx = Math.max(0, Math.min(this.initialX + dx, window.innerWidth - this.modal.offsetWidth));
    const ny = Math.max(0, Math.min(this.initialY + dy, window.innerHeight - this.modal.offsetHeight));
    this.modal.style.left = nx+'px'; this.modal.style.top = ny+'px'; this.modal.style.right='auto';
  }
  stopDrag() { this.isDragging=false; this.modal.style.transition=''; }
}

// Sound System
export const sounds = {
  capture: new Audio('./audio/capture.mp3'),
  invalid: new Audio('./audio/invalid.mp3'),
  winner:  new Audio('./audio/winner.mp3'),
  jackpot: new Audio('./audio/jackpot.mp3')
};

export function initSounds() {
  Object.values(sounds).forEach(a => { a.preload='auto'; a.volume=0.7; });
}
export function playSound(type) {
  if (sounds[type]) sounds[type].play();
}

// Modal Helpers
export function rankPlayers(gameEngine) {
  return gameEngine.getRankedPlayers();
}

export function createConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;
  container.innerHTML = '';
  for (let i=0; i<50; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = `${Math.random()*100}%`;
    c.style.animationDelay = `${Math.random()*2}s`;
    container.appendChild(c);
  }
}

export function parseJackpotMessage(message) {
  const m = message && message.match(/🏆\s+(\w+)\s+sweeps\s+(\d+)\s+remaining\s+cards!\s+\+(\d+)\s+pts/);
  return m && { winner:m[1], cardsCount:+m[2], bonusPoints:+m[3] } || null;
}

export function createJackpotAnnouncement(info) {
  if (!info) return '';
  return `<div class="jackpot-announcement-clean">
    <span class="jackpot-icon-small">🏆</span>
    <span><strong>${info.winner}</strong> swept ${info.cardsCount} cards! +${info.bonusPoints} pts</span>
  </div>`;
}

export function createScoreBreakdown(player, info) {
  const isWin = info && info.winner===player.name;
  if (!isWin) return `<span class="scoreboard-score">${player.score} pts</span>`;
  const base = player.score - info.bonusPoints;
  return `<div class="jackpot-winner-score-clean">
    <span class="final-score-clean">${player.score} pts</span>
    <span class="score-breakdown-clean">(${base} + 🏆${info.bonusPoints})</span>
  </div>`;
}

export function showRoundEndModal(endResult) {
  const modal = document.getElementById('scoreboard-modal');
  if (!modal) return;
  const info    = parseJackpotMessage(endResult.message);
  const players = rankPlayers(window.game);
  const jackpotEl = document.getElementById('jackpot-message');
  const titleEl   = document.getElementById('scoreboard-title');
  const listEl    = document.getElementById('scoreboard-list');
  const btnsEl    = document.getElementById('scoreboard-buttons');
  createConfetti();
  jackpotEl.innerHTML = info
    ? createJackpotAnnouncement(info)
    : `<div class="round-message">${endResult.message||''}</div>`;
  jackpotEl.className = info ? 'visible jackpot-celebration' : 'visible';
  titleEl.textContent = `Round ${window.game.currentRound} Complete!`;
  listEl.innerHTML = players.map((p,i) => `
    <div class="scoreboard-item ${i===0?'leader':''} ${info&&info.winner===p.name?'jackpot-winner':''}">
      <span class="scoreboard-rank">${['🥇','🥈','🥉'][i]||i+1}</span>
      ${createScoreBreakdown(p,info)}
    </div>
  `).join('');
  btnsEl.innerHTML = `<button id="next-round-btn" class="continue-btn">Continue</button>`;
  modal.showModal();
  playSound(info?'jackpot':'winner');
  document.getElementById('next-round-btn')
          .addEventListener('click',()=>{ modal.close(); dealNewRound(); });
}

export function showGameOverModal(endResult) {
  const modal = document.getElementById('scoreboard-modal');
  if (!modal) return;
  const info    = parseJackpotMessage(endResult.message);
  const players = rankPlayers(window.game);
  const winner  = players[0];
  createConfetti();
  const jackpotEl = document.getElementById('jackpot-message');
  const titleEl   = document.getElementById('scoreboard-title');
  const listEl    = document.getElementById('scoreboard-list');
  const btnsEl    = document.getElementById('scoreboard-buttons');
  jackpotEl.innerHTML = info
    ? createJackpotAnnouncement(info)
    : `<div class="game-end-message">${endResult.message||''}</div>`;
  titleEl.textContent = info
    ? `🏆 ${winner.name} Wins with Jackpot!`
    : `🎉 Game Over - ${winner.name} Wins!`;
  listEl.innerHTML = players.map((p,i) => `
    <div class="scoreboard-item ${i===0?'leader':''} ${info&&info.winner===p.name?'jackpot-winner ultimate-winner':''}">
      <span class="scoreboard-rank">${['🥇','🥈','🥉'][i]||i+1}</span>
      ${createScoreBreakdown(p,info)}
    </div>
  `).join('');
  btnsEl.innerHTML = `<button id="restart-btn" class="continue-btn">Play Again</button>`;
  modal.showModal();
  playSound(info?'jackpot':'winner');
  document.getElementById('restart-btn')
          .addEventListener('click',()=>{ modal.close(); window.location.reload(); });
}

export function dealNewRound() {
  window.game.rotateDealerClockwise();
  window.game.currentRound++;
  try {
    const newDeck = shuffleDeck(createDeck());
    const result  = dealCards(newDeck,3,4,4);
    window.game.state.hands = result.players;
    window.game.state.board = result.board;
    window.game.state.deck  = result.remainingDeck;
    window.game.state.lastCapturer = null;
    window.messageController.handleGameEvent('NEW_ROUND',{ roundNumber: window.game.currentRound });
    window.ui.render();
  } catch (e) {
    console.error('Error dealing new round:', e);
    window.messageController.handleGameEvent('CAPTURE_ERROR',{ message:'Error dealing cards! Restart the game.' });
  }
}
