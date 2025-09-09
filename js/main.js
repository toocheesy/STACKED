class HintSystem {
  constructor(gameEngine, uiSystem) {
    this.game = gameEngine;
    this.ui = uiSystem;
    this.suitSymbols = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
    this.currentHints = [];
    this.highlightedCards = [];
  }


analyzeAllPossibleCaptures() {
  if (this.game.state.currentPlayer !== 0) {
    return [];
  }

  const playerHand = this.game.state.hands[0];
  const board = this.game.state.board;

  if (!window.cardIntelligence) {
return this.basicHintDetection(playerHand, board);
  }


  const bestCapture = window.cardIntelligence.findBestCapture(playerHand, board, 'calculator');

  if (bestCapture) {
return [this.convertToHintFormat(bestCapture)];
  }


  const allCaptures = [];
  playerHand.forEach((handCard, handIndex) => {
    const captures = canCapture(handCard, board);
    captures.forEach(capture => {
      allCaptures.push(this.convertGameLogicToHint(handCard, handIndex, capture));
    });
  });

  return this.prioritizeHints(allCaptures);
}

convertToHintFormat(bestCapture) {
  const handCard = bestCapture.handCard;
  const handIndex = this.game.state.hands[0].findIndex(card => card.id === handCard.id);


  const targetCards = bestCapture.capture.targets.map(targetCard => {
    const boardIndex = this.game.state.board.findIndex(card => card.id === targetCard.id);
    return { card: targetCard, index: boardIndex };
  });

  return {
    type: bestCapture.capture.type,
    handCard: { card: handCard, index: handIndex },
    targetCards: targetCards,
    area: bestCapture.capture.type === 'pair' ? 'match' : 'sum1',
    score: bestCapture.evaluation.totalScore,
    description: bestCapture.evaluation.reasoning
  };
}

convertGameLogicToHint(handCard, handIndex, capture) {
  const targetCards = capture.cards.map(cardIndex => {
    return { card: this.game.state.board[cardIndex], index: cardIndex };
  });

  return {
    type: capture.type,
    handCard: { card: handCard, index: handIndex },
    targetCards: targetCards,
    area: capture.type === 'pair' ? 'match' : 'sum1',
    score: capture.score || this.calculateCaptureScore([handCard, ...targetCards.map(tc => tc.card)]),
    description: `${capture.type.toUpperCase()}: ${handCard.value}${this.suitSymbols[handCard.suit]} captures ${targetCards.map(tc => tc.card.value + this.suitSymbols[tc.card.suit]).join(' + ')}`
  };
}

basicHintDetection(playerHand, board) {
  const allCaptures = [];

  playerHand.forEach((handCard, handIndex) => {
    if (typeof canCapture === 'function') {
      const captures = canCapture(handCard, board);
      captures.forEach(capture => {
        allCaptures.push(this.convertGameLogicToHint(handCard, handIndex, capture));
      });
    }
  });

  return this.prioritizeHints(allCaptures);
}


  prioritizeHints(captures) {
    if (captures.length === 0) return [];

    return captures.sort((a, b) => {

      if (a.score !== b.score) return b.score - a.score;


      const aComplexity = a.targetCards.length;
      const bComplexity = b.targetCards.length;
      if (aComplexity !== bComplexity) return bComplexity - aComplexity;


      if (a.type !== b.type) {
        return a.type === 'pair' ? -1 : 1;
      }

      return 0;
    });
  }


  calculateCaptureScore(cards) {
    const pointsMap = {
      'A': 15, 'K': 10, 'Q': 10, 'J': 10, '10': 10,
      '9': 5, '8': 5, '7': 5, '6': 5, '5': 5, '4': 5, '3': 5, '2': 5
    };
    return cards.reduce((total, card) => total + (pointsMap[card.value] || 0), 0);
  }


  getCardValue(card) {
    if (card.value === 'A') return 1;
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    return parseInt(card.value) || 0;
  }


  showHint() {

    this.clearHints();


    const captures = this.analyzeAllPossibleCaptures();

    if (captures.length === 0) {
      this.showNoHintsMessage();
      return;
    }


    const bestHint = captures[0];

    this.displayHintPopup(bestHint);
    this.highlightHintCards(bestHint);


    this.currentHints = [bestHint];
  }


  displayHintPopup(hint) {

    const existingPopup = document.getElementById('hint-popup');
    if (existingPopup) {
      existingPopup.remove();
    }


    const popup = document.createElement('div');
    popup.id = 'hint-popup';
    popup.className = 'hint-popup';


    const handCardName = `${hint.handCard.card.value}${this.suitSymbols[hint.handCard.card.suit]}`;
    const targetNames = hint.targetCards.map(tc =>
      `${tc.card.value}${this.suitSymbols[tc.card.suit]}`
    ).join(' + ');

    let suggestionText = '';
    if (hint.type === 'pair') {
      suggestionText = ` <strong>PAIR CAPTURE!</strong><br>
                       Use <span class="highlight-card">${handCardName}</span> to capture <span class="highlight-card">${targetNames}</span><br>
                       <small>• Place both in Match area • Worth ${hint.score} points!</small>`;
    } else {
      suggestionText = ` <strong>SUM CAPTURE!</strong><br>
                       Use <span class="highlight-card">${handCardName}</span> as base, capture <span class="highlight-card">${targetNames}</span><br>
                       <small>• Place base in Base area, targets in ${hint.area.charAt(0).toUpperCase() + hint.area.slice(1)} area • Worth ${hint.score} points!</small>`;
    }

    popup.innerHTML = `
      <div class="hint-content">
        <div class="hint-header"> SMART HINT</div>
        <div class="hint-suggestion">${suggestionText}</div>
        <button class="hint-close" onclick="window.hintSystem.clearHints()">Got it! </button>
      </div>
    `;


    const gameArea = document.querySelector('.table') || document.body;
    gameArea.appendChild(popup);


    setTimeout(() => popup.classList.add('show'), 50);


    setTimeout(() => this.clearHints(), 8000);
  }


  highlightHintCards(hint) {
    const highlightedElements = [];


    const handCards = document.querySelectorAll('#player-hand .card');
    if (handCards[hint.handCard.index]) {
      handCards[hint.handCard.index].classList.add('hint-glow', 'hint-hand-card');
      highlightedElements.push(handCards[hint.handCard.index]);
    }


    hint.targetCards.forEach(target => {
      const boardCards = document.querySelectorAll('#board .card');
      if (boardCards[target.index]) {
        boardCards[target.index].classList.add('hint-glow', 'hint-target-card');
        highlightedElements.push(boardCards[target.index]);
      }
    });

    this.highlightedCards = highlightedElements;
}


  showNoHintsMessage() {
    const popup = document.createElement('div');
    popup.id = 'hint-popup';
    popup.className = 'hint-popup';

    popup.innerHTML = `
      <div class="hint-content">
        <div class="hint-header"> NO CAPTURES AVAILABLE</div>
        <div class="hint-suggestion">
          <strong>Try placing a card to end your turn!</strong><br>
          <small>• Drag a card from your hand to the board</small><br>
          <small>• Look for strategic placements</small>
        </div>
        <button class="hint-close" onclick="window.hintSystem.clearHints()">Understood </button>
      </div>
    `;

    const gameArea = document.querySelector('.table') || document.body;
    gameArea.appendChild(popup);

    setTimeout(() => popup.classList.add('show'), 50);
    setTimeout(() => this.clearHints(), 5000);
  }


  clearHints() {

    const popup = document.getElementById('hint-popup');
    if (popup) {
      popup.classList.remove('show');
      setTimeout(() => popup.remove(), 300);
    }


    this.highlightedCards.forEach(card => {
      card.classList.remove('hint-glow', 'hint-hand-card', 'hint-target-card');
    });

    this.highlightedCards = [];
    this.currentHints = [];

}


}

let game = null;
let ui = null;
let botModal = null;
let modeSelector = null;

const gameStateManager = window.gameStateManager;

let botTurnInProgress = false;

function initGameSystems() {
  modeSelector = new ModeSelector();
  modeSelector.registerMode('classic', ClassicMode);
  modeSelector.registerMode('speed', SpeedMode);

  game = new GameEngine();
  ui = new UISystem(game);
  botModal = new BotModalInterface(game, ui);
}

function startGame(modeName = 'classic', settings = {}) {
  const selectedMode = modeSelector.getSelectedModeObject() || ClassicMode;
  const modeSettings = modeSelector.getSelectedModeSettings();
  Object.assign(settings, modeSettings);

  game.initGame(selectedMode, settings);
  ui.render();

}

function initGame() {
  if (window.cardIntelligence) {
    window.cardIntelligence.reset();
  }

initGameSystems();


  const storedDifficulty = localStorage.getItem('selectedDifficulty') || 'intermediate';
  const storedMode = localStorage.getItem('selectedMode');

  if (storedMode && modeSelector.availableModes[storedMode]) {
    modeSelector.currentMode = storedMode;
  }

  const gameSettings = {
    botDifficulty: storedDifficulty,
    cardSpeed: 'fast',
    soundEffects: 'off',
    targetScore: 500
  };

  startGame(modeSelector.currentMode || 'classic', gameSettings);

if (game.state.currentPlayer !== 0) {
setTimeout(() => scheduleNextBotTurn(), 1000);
}

localStorage.removeItem('selectedDifficulty');
localStorage.removeItem('selectedMode');
}

function handleSubmit() {
  if (game.state.currentPlayer !== 0) return;

  const baseCards = game.state.combination.base;

  if (baseCards.length !== 1) {

    window.messageController.handleGameEvent('CAPTURE_ERROR', {
      message: "Base Card area must have exactly one card!"
    });
    playSound('invalid');
    return;
  }

  const baseCard = baseCards[0];
  const baseValue = parseInt(baseCard.card.value) || (window.valueMap && window.valueMap[baseCard.card.value]) || 1;

  let validCaptures = [];
  let allCapturedCards = [baseCard.card];

  const captureAreas = [
    { name: 'sum1', cards: game.state.combination.sum1 },
    { name: 'sum2', cards: game.state.combination.sum2 },
    { name: 'sum3', cards: game.state.combination.sum3 },
    { name: 'match', cards: game.state.combination.match }
  ];

  for (const area of captureAreas) {
    if (area.cards.length > 0) {
      const result = game.validateCapture(area.cards, baseValue, baseCard, area.name);

      if (result.isValid) {
        validCaptures.push({ name: area.name, cards: area.cards });
        allCapturedCards.push(...area.cards.map(entry => entry.card));
      } else {
        const areaNames = {
          'sum1': 'Sum Area 1',
          'sum2': 'Sum Area 2',
          'sum3': 'Sum Area 3',
          'match': 'Match Area'
        };

        window.messageController.handleGameEvent('CAPTURE_ERROR', {
          message: `${areaNames[area.name]}: ${result.details}`
        });
        playSound('invalid');
        return;
      }
    }
  }

  if (validCaptures.length === 0) {

    window.messageController.handleGameEvent('CAPTURE_ERROR', {
      message: "No valid captures found - check your combinations!"
    });
    playSound('invalid');
    return;
  }

  game.executeCapture(baseCard, validCaptures, allCapturedCards);
window.cardIntelligence.updateCardsSeen(allCapturedCards);

game.state.lastAction = 'capture';
if (game.currentMode.onCapture) {
    game.currentMode.onCapture(game, allCapturedCards);
  }


  const points = game.calculateScore(allCapturedCards);
  window.messageController.handleGameEvent('CAPTURE_SUCCESS', {
    points: points,
    cardsCount: allCapturedCards.length
  });

  game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };

    ui.render();
  playSound('capture');


  const result = window.gameStateManager.determineGameState(game);
  handleGameStateResult(result);
}

function handleResetPlayArea() {
  if (game.state.currentPlayer !== 0) return;

  Object.values(game.state.combination).flat().forEach(entry => {
    if (entry.source === 'hand' && game.state.hands[0][entry.index]) {
      game.state.hands[0][entry.index] = entry.card;
    } else if (entry.source === 'board' && game.state.board[entry.index]) {
      game.state.board[entry.index] = entry.card;
    }
  });

  game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };


  window.messageController.handleGameEvent('RESET_COMBO');

  ui.render();
}

function handleBoardDrop(e) {
  console.log('🎯 BOARD DROP EVENT FIRED!');
  e.preventDefault();
  if (game.state.currentPlayer !== 0 || !game.state.draggedCard) return;

  if (game.state.draggedCard.slot !== undefined) {
    game.state.combination[game.state.draggedCard.slot] = game.state.combination[game.state.draggedCard.slot].filter((_, i) => i !== game.state.draggedCard.comboIndex);

    if (game.state.draggedCard.source === 'hand') {
      game.state.hands[0][game.state.draggedCard.index] = game.state.draggedCard.card;
    }

    game.state.draggedCard = null;
    ui.render();

    window.messageController.handleGameEvent('RESET_COMBO');
    return;
  }

  if (game.state.draggedCard.source !== 'hand') return;

  const handCard = game.state.draggedCard.card;
  const handIndex = game.state.draggedCard.index;

  try {
    const actualCard = game.state.hands[0][handIndex];
    if (!actualCard || actualCard.id !== handCard.id) {
      game.state.draggedCard = null;
      ui.render();
      return;
    }

    game.state.hands[0].splice(handIndex, 1);
    game.state.board.push(handCard);
    window.cardIntelligence.updateCardsSeen([handCard]);
    game.state.combination = { base: [], sum1: [], sum2: [], sum3: [], match: [] };
    game.state.draggedCard = null;

  game.state.lastAction = 'place';

    window.messageController.handleGameEvent('CARD_PLACED', {
      cardName: `${handCard.value}${handCard.suit}`
    });

        ui.render();


    const gs = window.gameStateManager.determineGameState(game);
    handleGameStateResult(gs);


  } catch (error) {
game.state.draggedCard = null;
    ui.render();
  }
}

let checkGameEndCount = 0;

function checkGameEnd() {

  const result = window.gameStateManager.determineGameState(game);

  switch(result.state) {
    case 'CONTINUE_TURN':
      handleContinueTurn(result);
      break;

    case 'DEAL_NEW_HAND':
      handleDealNewHand(result);
      break;

    case 'END_ROUND':
      handleEndRound(result);
      break;

    case 'END_GAME':
      handleEndGame(result);
      break;

    case 'ERROR':
      handleGameStateError(result);
      break;

    default:
handleGameStateError({
        data: {
          message: `Unknown game state: ${result.state}`,
          userMessage: 'Game encountered an unknown state. Please restart.',
          technicalDetails: JSON.stringify(result, null, 2)
        }
      });
  }
}

async function aiTurn() {

  if (botTurnInProgress) {
return;
  }


  if (game.state.currentPlayer === 0) {
return;
  }

  const playerIndex = game.state.currentPlayer;


    if (!game.state.hands[playerIndex] || game.state.hands[playerIndex].length === 0) {
ui.render();
    const gs = window.gameStateManager.determineGameState(game);
    handleGameStateResult(gs);
    return;
  }


  botTurnInProgress = true;

  try {

    const move = aiMove(game.state.hands[playerIndex], game.state.board, game.state.settings.botDifficulty);

    let result;

    if (move && move.action === 'capture') {
result = await botModal.executeCapture(move, playerIndex);
    } else {
      const cardToPlace = move ? move.handCard : game.state.hands[playerIndex][0];
result = await botModal.placeCard(cardToPlace, playerIndex);
    }


    botTurnInProgress = false;

    if (result.success) {
if (result.action === 'capture') {

        if (window.messageController && move && move.capture) {
          const actualPoints = game.calculateScore([move.handCard, ...move.capture.targets]);
          window.messageController.handleGameEvent('CAPTURE_SUCCESS', {
            points: actualPoints,
            cardsCount: move.capture.targets.length + 1
          });
        }


        const remainingCards = game.state.hands[playerIndex].length;

        const gs = window.gameStateManager.determineGameState(game);
        handleGameStateResult(gs);

      } else if (result.action === 'place') {

        ui.render();
        const gs = window.gameStateManager.determineGameState(game);
        handleGameStateResult(gs);

      }
    } else {

      const fallbackCard = game.state.hands[playerIndex][0];
      if (fallbackCard) {
result = await botModal.placeCard(fallbackCard, playerIndex);
        if (result.success) {
          ui.render();
          const gs = window.gameStateManager.determineGameState(game);
          handleGameStateResult(gs);
        }

      }
    }

  } catch (error) {

    botTurnInProgress = false;

    game.nextPlayer();
    ui.render();
  }
}

async function scheduleNextBotTurn() {

  if (botTurnInProgress) {
return;
  }


  if (game.state.currentPlayer === 0) {
return;
  }

setTimeout(async () => {
await aiTurn();
  }, 3000);
}

function playSound(type) {
  if (game.state.settings.soundEffects === 'on' && window.sounds && window.sounds[type]) {
    window.sounds[type].play().catch(e => console.error('Sound play failed:', e));
  }
}

function handleDragStart(e, source, index) {
  console.log('🎯 DRAG START:', source, index, 'Current player:', game.state.currentPlayer);

  if (window.gameIsPaused || (ui && ui.modalManager && ui.modalManager.isModalActive())) {
    e.preventDefault();
    console.log('❌ DRAG BLOCKED: Game paused or modal active');
    return;
  }

  if (game.state.currentPlayer !== 0) {
    console.log('❌ DRAG BLOCKED: Not player turn (current:', game.state.currentPlayer, ')');
    return;
  }
  
  game.state.draggedCard = {
    source,
    index,
    card: source === 'hand' ? game.state.hands[0][index] : game.state.board[index]
  };
  console.log('✅ DRAGGED CARD SET:', game.state.draggedCard);
  e.target.classList.add('selected');
}

function handleDragStartCombo(e, slot, comboIndex) {
  if (game.state.currentPlayer !== 0) return;
  game.state.draggedCard = game.state.combination[slot][comboIndex];
  game.state.draggedCard.slot = slot;
  game.state.draggedCard.comboIndex = comboIndex;
  e.target.classList.add('selected');
}

function handleDragEnd(e) {
  e.target.classList.remove('selected');
  game.state.draggedCard = null;
}

function handleDrop(e, slot) {
  console.log('🎯 DROP EVENT FIRED!', slot);
  e.preventDefault();
  console.log('🎯 DROP ATTEMPT on slot:', slot);

  if (window.gameIsPaused || (ui && ui.modalManager && ui.modalManager.isModalActive())) {
    console.log('❌ DROP BLOCKED: Game paused or modal');
    return;
  }

  if (game.state.currentPlayer !== 0) {
    console.log('❌ DROP BLOCKED: Not player turn');
    return;
  }

  if (!game.state.draggedCard) {
    console.log('❌ DROP BLOCKED: No dragged card');
    return;
  }
  
  console.log('✅ DROP PROCEEDING with card:', game.state.draggedCard);

  if (game.state.draggedCard.slot !== undefined) {
    game.state.combination[game.state.draggedCard.slot] = game.state.combination[game.state.draggedCard.slot].filter((_, i) => i !== game.state.draggedCard.comboIndex);
  }

  if (slot === 'base' && game.state.combination.base.length > 0) {
    const existingBase = game.state.combination.base[0];
    game.state.combination.base = [];
    if (game.state.combination.sum1.length === 0) {
      game.state.combination.sum1.push(existingBase);
    } else if (game.state.combination.sum2.length === 0) {
      game.state.combination.sum2.push(existingBase);
    } else if (game.state.combination.sum3.length === 0) {
      game.state.combination.sum3.push(existingBase);
    } else {
      game.state.combination.match.push(existingBase);
    }
  }


  const cardBeingDropped = game.state.draggedCard.card;
  const sourceType = game.state.draggedCard.source;


const currentPlayer = game.state.currentPlayer;
game.state.combination[slot].push({
  source: game.state.draggedCard.source,
  index: game.state.draggedCard.index,
  card: game.state.draggedCard.card,
  playerSource: currentPlayer,
  fromBot: currentPlayer !== 0
});

game.state.draggedCard = null;


  if (window.messageController && window.messageController.educationalMode) {
    const suitSymbols = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
    const cardName = `${cardBeingDropped.value}${suitSymbols[cardBeingDropped.suit]}`;

    window.messageController.handleGameEvent('CARD_ADDED_TO_COMBO', {
      slot: slot,
      cardName: cardName,
      card: cardBeingDropped,
      source: sourceType
    });
  }

  ui.render();
}

function handleDropOriginal(e, source, index) {
  e.preventDefault();


  if (game.state.currentPlayer !== 0) {
return;
  }

  if (!game.state.draggedCard) return;

  if (game.state.draggedCard.slot !== undefined) {
    const originalSlot = game.state.draggedCard.slot;
    game.state.combination[originalSlot] = game.state.combination[originalSlot].filter((_, i) => i !== game.state.draggedCard.comboIndex);
    game.state.draggedCard = null;
    ui.render();
  }
}

// 📱 WORKING TOUCH EVENT HANDLERS
let touchDragData = null;
let touchStartPosition = null;

function handleTouchStart(e, source, data) {
  if (game.state.currentPlayer !== 0) return;
  e.preventDefault();
  
  // Store what we're dragging
  if (source === 'hand') {
    touchDragData = {
      type: 'hand',
      index: data,
      card: game.state.hands[0][data]
    };
  } else if (source === 'board') {
    touchDragData = {
      type: 'board', 
      index: data,
      card: game.state.board[data]
    };
  } else if (source === 'combo') {
    touchDragData = {
      type: 'combo',
      slot: data.slot,
      comboIndex: data.comboIndex,
      card: game.state.combination[data.slot][data.comboIndex]
    };
  }
  
  // Store touch position
  touchStartPosition = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY
  };
  
  console.log('🎯 TOUCH START:', touchDragData);
}

function handleTouchEnd(e) {
  console.log('🚨 TOUCH END CALLED!', e);
  if (game.state.currentPlayer !== 0) return;
  e.preventDefault();
  
  if (!touchDragData || !touchStartPosition) {
    console.log('❌ NO TOUCH DATA:', touchDragData, touchStartPosition);
    return;
  }
  
  // Get touch end position
  const touchEndPosition = {
    x: e.changedTouches[0].clientX,
    y: e.changedTouches[0].clientY
  };
  
  console.log('🎯 TOUCH END POSITION:', touchEndPosition);
  
  // Find what element we're over
  const elementBelow = document.elementFromPoint(
    touchEndPosition.x, 
    touchEndPosition.y
  );
  
  console.log('🎯 ELEMENT BELOW:', elementBelow);
  
  if (!elementBelow) {
    console.log('❌ NO ELEMENT BELOW');
    touchDragData = null;
    return;
  }
  
  // Check if we're over a valid drop zone
  const comboArea = elementBelow.closest('.combo-slot');
  console.log('🎯 COMBO AREA FOUND:', comboArea);
  
  if (comboArea) {
    const slotName = comboArea.getAttribute('data-slot');
    console.log('🎯 DROPPING ON SLOT:', slotName);
    handleTouchDropOnCombo(slotName);
  } else {
    console.log('❌ NOT OVER COMBO AREA');
  }
  
  // Clear touch data
  touchDragData = null;
  touchStartPosition = null;
}

function handleTouchDropOnCombo(slotName) {
  if (!touchDragData) return;
  
  console.log(`🎯 TOUCH DROP ON COMBO: ${slotName}`, touchDragData);
  
  // Simulate the drag and drop logic
  if (touchDragData.type === 'combo') {
    // Remove from old combo position
    game.state.combination[touchDragData.slot] = 
      game.state.combination[touchDragData.slot].filter((_, i) => i !== touchDragData.comboIndex);
  }
  
  // Handle base area replacement logic (same as handleDrop)
  if (slotName === 'base' && game.state.combination.base.length > 0) {
    const existingBase = game.state.combination.base[0];
    game.state.combination.base = [];
    if (game.state.combination.sum1.length === 0) {
      game.state.combination.sum1.push(existingBase);
    } else if (game.state.combination.sum2.length === 0) {
      game.state.combination.sum2.push(existingBase);
    } else if (game.state.combination.sum3.length === 0) {
      game.state.combination.sum3.push(existingBase);
    } else {
      game.state.combination.match.push(existingBase);
    }
  }
  
  // Add to new position
  const cardEntry = {
    card: touchDragData.card,
    source: touchDragData.type === 'combo' ? touchDragData.card.source : touchDragData.type,
    index: touchDragData.type === 'combo' ? touchDragData.card.index : touchDragData.index,
    playerSource: 0
  };
  
  game.state.combination[slotName].push(cardEntry);
  
  // Re-render the UI
  ui.render();
  
  console.log('✅ TOUCH DROP COMPLETE');
}

function handleTouchDrop(e, targetType, data) {
  e.preventDefault();
  // This function can stay simple since handleTouchEnd handles the logic
  console.log('🎯 TOUCH DROP EVENT:', targetType, data);
}

function provideHint() {
  if (game.state.currentPlayer !== 0) {
return;
  }


  if (!window.hintSystem) {
    window.hintSystem = new HintSystem(game, ui);
  }


  window.hintSystem.showHint();
}

document.addEventListener('DOMContentLoaded', () => {
  // 🔥 FIX: Try multiple possible button selectors to match your HTML
  
  // Submit button - try both status bar and combo area buttons
  const submitBtn = document.getElementById('submit-btn') 
    || document.getElementById('submit-move-btn');
  
  // Reset button - try both possible IDs
  const resetBtn = document.getElementById('reset-play-area-btn') 
    || document.getElementById('reset-btn');
    
  // Hint button
  const hintBtn = document.getElementById('hint-btn');

  // Debug logging
  console.log('🔍 BUTTON CHECK:');
  console.log('  Submit button:', submitBtn ? '✅ FOUND' : '❌ MISSING');
  console.log('  Reset button:', resetBtn ? '✅ FOUND' : '❌ MISSING');
  console.log('  Hint button:', hintBtn ? '✅ FOUND' : '❌ MISSING');

  // Attach event listeners
  if (submitBtn) {
    submitBtn.addEventListener('click', handleSubmit);
    console.log('✅ Submit button event attached');
  } else {
    console.error('❌ Submit button not found!');
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', handleResetPlayArea);
    console.log('✅ Reset button event attached');
  } else {
    console.error('❌ Reset button not found!');
  }
  
  if (hintBtn) {
    hintBtn.addEventListener('click', provideHint);
    console.log('✅ Hint button event attached');
  } else {
    console.error('❌ Hint button not found!');
  }
});

window.handleDragStart = handleDragStart;
window.handleDragStartCombo = handleDragStartCombo;
window.handleDragEnd = handleDragEnd;
window.handleDrop = handleDrop;
window.handleDropOriginal = handleDropOriginal;
window.handleBoardDrop = handleBoardDrop;
window.handleTouchStart = handleTouchStart;
window.handleTouchEnd = handleTouchEnd;
window.handleTouchDrop = handleTouchDrop;

window.DraggableModal = DraggableModal;
window.HintSystem = HintSystem;

function handleContinueTurn(result) {
  const playerIndex = result.data.playerIndex;
game.state.currentPlayer = playerIndex;
  ui.render();

  if (playerIndex !== 0) {

    setTimeout(() => aiTurn(), 1000);
  } else {
    window.messageController.handleGameEvent('TURN_START');
  }
}

function handleDealNewHand(result) {
try {

    const dealResult = dealCards(game.state.deck, 3, 4, 0);
    game.state.hands = dealResult.players;
    game.state.deck = dealResult.remainingDeck;


    game.state.currentPlayer = result.data.startingPlayer;
    game.state.lastCapturer = null;

window.messageController.handleGameEvent('NEW_HAND', {
  handNumber: Math.floor((52 - game.state.deck.length) / 12),
  roundNumber: game.currentRound
});


    ui.render();


    if (result.data.startingPlayer !== 0) {
setTimeout(() => scheduleNextBotTurn(), 1000);
    }

  } catch (error) {
window.messageController.handleGameEvent('CAPTURE_ERROR', {
      message: 'Error dealing new hand! Please restart the game.'
    });
  }
}

function handleEndRound(result) {

  if (result.data.jackpot.hasJackpot) {

    const jackpot = result.data.jackpot;
    game.addScore(jackpot.winner, jackpot.points);
    game.addOverallScore(jackpot.winner, jackpot.points);


    game.state.board = [];
  }


  if (game.currentMode.onRoundEnd) {
    game.currentMode.onRoundEnd(game);
  }


  ui.showModal('round_end', result.data);


}

function resumeNextRound(roundData) {

  game.state.deck = createDeck();

  const newStartingPlayer = (roundData.newDealer + 1) % 3;
  game.state.currentPlayer = newStartingPlayer;


  const dealResult = dealCards(game.state.deck, 3, 4, 4);
  game.state.hands = dealResult.players;
  game.state.deck = dealResult.remainingDeck;
  game.state.board = dealResult.board;

console.log(` NEW CARDS DEALT: Hands=[${game.state.hands.map(h => h.length)}], Board=${game.state.board.length}, Deck=${game.state.deck.length}`);


  game.currentRound = roundData.newRound;
  game.currentDealer = roundData.newDealer;

  ui.render();


  if (newStartingPlayer !== 0) {
setTimeout(() => scheduleNextBotTurn(), 1000);
  }
}

function handleEndGame(result) {

  if (result.data.jackpot.hasJackpot) {

    const jackpot = result.data.jackpot;
    game.addScore(jackpot.winner, jackpot.points);
    game.addOverallScore(jackpot.winner, jackpot.points);


    game.state.board = [];
  }


  if (game.currentMode.onGameEnd) {
    game.currentMode.onGameEnd(game);
  }


  ui.showModal('game_over', result.data);


  ui.render();
}

function handleGameStateError(result) {
console.error(` TECHNICAL DETAILS:`, result.data.technicalDetails);


  ui.showModal('error', result.data);


  window.messageController.handleGameEvent('CAPTURE_ERROR', {
    message: result.data.userMessage
  });
}

window.resumeNextRound = resumeNextRound;

initGame();

function handleGameStateResult(result) {
switch(result.state) {
    case gameStateManager.STATES.CONTINUE_TURN:
      handleContinueTurn(result);
      break;

    case gameStateManager.STATES.DEAL_NEW_HAND:
      handleDealNewHand(result);
      break;

    case gameStateManager.STATES.END_ROUND:
      handleEndRound(result);
      break;

    case gameStateManager.STATES.END_GAME:
      handleEndGame(result);
      break;

    case gameStateManager.STATES.ERROR:
      handleGameStateError(result);
      break;

    default:
}
}

window.gameIsPaused = false;
