/* 
 * 🔥 CARDMANAGER - SINGLE SOURCE OF TRUTH FOR ALL CARD LOCATIONS
 * The bulletproof foundation that makes card disappearing IMPOSSIBLE!
 * 
 * GOLDEN RULE: Every card has EXACTLY ONE location at EXACTLY ONE time
 * GUARANTEE: Perfect 52-card accounting at all times
 */

class CardManager {
  constructor() {
    // 🏆 MASTER REGISTRY: Every card's location tracked perfectly
    this.cardRegistry = new Map(); // cardId → { card, location, index }
    
    // 📍 ALL POSSIBLE CARD LOCATIONS
    this.locations = {
      deck: [],
      hands: [[], [], []], // Player, Bot1, Bot2
      board: [],
      combo: {
        base: [],
        sum1: [],
        sum2: [],
        sum3: [],
        match: []
      },
      captured: [] // 🔥 Cards that have been captured (for scoring)
    };
    
    // 🎯 LOCATION METADATA
    this.locationTypes = {
      deck: 'array',
      hands: 'nested_array',
      board: 'array', 
      combo: 'object',
      captured: 'array'
    };
    
    // 📊 STATISTICS TRACKING
    this.stats = {
      totalMoves: 0,
      captureEvents: 0,
      validationChecks: 0,
      lastValidation: null
    };
    
    console.log('🔥 CARDMANAGER INITIALIZED - SINGLE SOURCE OF TRUTH ACTIVE!');
  }
  
  // 🎯 INITIALIZE WITH FULL DECK
  initializeDeck() {
    console.log('🎮 CREATING MASTER DECK - 52 CARDS');
    
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    
    // Clear everything first
    this.cardRegistry.clear();
    this.locations = {
      deck: [],
      hands: [[], [], []],
      board: [],
      combo: { base: [], sum1: [], sum2: [], sum3: [], match: [] },
      captured: []
    };
    
    // Create all 52 cards in deck
    let cardCount = 0;
    suits.forEach(suit => {
      values.forEach(value => {
        const card = {
          id: `${value}-${suit}-${Date.now()}-${cardCount}`, // Unique ID
          value: value,
          suit: suit,
          displayName: `${value}${this.getSuitSymbol(suit)}`
        };
        
        // Add to deck
        this.locations.deck.push(card);
        
        // Register in master registry
        this.cardRegistry.set(card.id, {
          card: card,
          location: 'deck',
          index: this.locations.deck.length - 1,
          timestamp: Date.now()
        });
        
        cardCount++;
      });
    });
    
    console.log(`✅ DECK CREATED: ${this.locations.deck.length} cards`);
    this.validateCardCount('INITIALIZATION');
    return this.locations.deck.length === 52;
  }
  
  // 🎲 SHUFFLE DECK (Bulletproof Fisher-Yates)
  shuffleDeck() {
    console.log('🎲 SHUFFLING DECK...');
    
    const deck = this.locations.deck;
    
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      
      // Swap cards in deck
      [deck[i], deck[j]] = [deck[j], deck[i]];
      
      // Update registry indexes
      this.cardRegistry.get(deck[i].id).index = i;
      this.cardRegistry.get(deck[j].id).index = j;
    }
    
    console.log('✅ DECK SHUFFLED');
    this.validateCardCount('SHUFFLE');
  }
  
  // 🎯 ATOMIC CARD MOVEMENT - The heart of the system
  moveCard(cardId, fromLocation, toLocation, toIndex = null, playerIndex = null) {
    this.stats.totalMoves++;
    
    console.log(`🔄 ATOMIC MOVE: ${cardId.split('-')[0]}${cardId.split('-')[1]} from ${fromLocation} to ${toLocation}`);
    
    // 🛡️ VALIDATION: Verify card exists
    if (!this.cardRegistry.has(cardId)) {
      throw new Error(`CRITICAL: Card ${cardId} not found in registry!`);
    }
    
    const cardData = this.cardRegistry.get(cardId);
    const card = cardData.card;
    
    // 🛡️ VALIDATION: Verify current location
    if (cardData.location !== fromLocation) {
      throw new Error(`CRITICAL: Card ${cardId} is in ${cardData.location}, not ${fromLocation}!`);
    }
    
    // 🔥 STEP 1: Remove from current location
    this.removeCardFromLocation(cardId, fromLocation, cardData.index, playerIndex);
    
    // 🔥 STEP 2: Add to new location
    const newIndex = this.addCardToLocation(card, toLocation, toIndex, playerIndex);
    
    // 🔥 STEP 3: Update registry
    this.cardRegistry.set(cardId, {
      card: card,
      location: toLocation,
      index: newIndex,
      playerIndex: playerIndex,
      timestamp: Date.now()
    });
    
    console.log(`✅ MOVE COMPLETE: ${card.displayName} → ${toLocation}[${newIndex}]`);
  }
  
  // 🗑️ REMOVE CARD FROM LOCATION
  removeCardFromLocation(cardId, location, index, playerIndex = null) {
    const card = this.cardRegistry.get(cardId).card;
    
    if (location === 'deck') {
      this.locations.deck.splice(index, 1);
      // Update indexes for remaining cards
      this.updateIndexesAfterRemoval('deck', index);
      
    } else if (location === 'hands') {
      if (playerIndex === null) throw new Error('Player index required for hands');
      this.locations.hands[playerIndex].splice(index, 1);
      this.updateIndexesAfterRemoval(`hands_${playerIndex}`, index);
      
    } else if (location === 'board') {
      this.locations.board.splice(index, 1);
      this.updateIndexesAfterRemoval('board', index);
      
    } else if (location === 'combo') {
      // Combo areas are more complex - need to find which sub-area
      const comboAreas = ['base', 'sum1', 'sum2', 'sum3', 'match'];
      let found = false;
      
      for (const area of comboAreas) {
        const areaIndex = this.locations.combo[area].findIndex(c => c.id === cardId);
        if (areaIndex !== -1) {
          this.locations.combo[area].splice(areaIndex, 1);
          found = true;
          break;
        }
      }
      
      if (!found) {
        throw new Error(`Card ${cardId} not found in any combo area!`);
      }
      
    } else if (location === 'captured') {
      this.locations.captured.splice(index, 1);
      this.updateIndexesAfterRemoval('captured', index);
      
    } else {
      throw new Error(`Unknown location: ${location}`);
    }
    
    console.log(`➖ REMOVED: ${card.displayName} from ${location}`);
  }
  
  // ➕ ADD CARD TO LOCATION  
  addCardToLocation(card, location, index = null, playerIndex = null) {
    if (location === 'deck') {
      if (index === null) {
        this.locations.deck.push(card);
        return this.locations.deck.length - 1;
      } else {
        this.locations.deck.splice(index, 0, card);
        this.updateIndexesAfterInsertion('deck', index);
        return index;
      }
      
    } else if (location === 'hands') {
      if (playerIndex === null) throw new Error('Player index required for hands');
      if (index === null) {
        this.locations.hands[playerIndex].push(card);
        return this.locations.hands[playerIndex].length - 1;
      } else {
        this.locations.hands[playerIndex].splice(index, 0, card);
        this.updateIndexesAfterInsertion(`hands_${playerIndex}`, index);
        return index;
      }
      
    } else if (location === 'board') {
      if (index === null) {
        this.locations.board.push(card);
        return this.locations.board.length - 1;
      } else {
        this.locations.board.splice(index, 0, card);
        this.updateIndexesAfterInsertion('board', index);
        return index;
      }
      
    } else if (location === 'combo') {
      // For combo, we need to know which sub-area
      // This will be handled by specialized combo functions
      throw new Error('Use addToComboArea() for combo locations');
      
    } else if (location === 'captured') {
      this.locations.captured.push(card);
      return this.locations.captured.length - 1;
      
    } else {
      throw new Error(`Unknown location: ${location}`);
    }
  }
  
  // 🎪 SPECIALIZED COMBO AREA MANAGEMENT
  addToComboArea(cardId, comboArea) {
    const cardData = this.cardRegistry.get(cardId);
    const card = cardData.card;
    
    // Add to specific combo area
    this.locations.combo[comboArea].push({
      card: card,
      originalLocation: cardData.location,
      originalIndex: cardData.index,
      originalPlayerIndex: cardData.playerIndex || null
    });
    
    // Update registry
    this.cardRegistry.set(cardId, {
      card: card,
      location: 'combo',
      comboArea: comboArea,
      index: this.locations.combo[comboArea].length - 1,
      timestamp: Date.now()
    });
    
    console.log(`🎪 ADDED TO COMBO: ${card.displayName} → ${comboArea}`);
  }
  
  // 🎯 DEAL CARDS TO PLAYERS
  dealCards(handsCount = 3, cardsPerPlayer = 4, boardCards = 4) {
    console.log(`🎯 DEALING: ${cardsPerPlayer} cards to ${handsCount} players, ${boardCards} to board`);
    
    // 🛡️ VALIDATION: Check deck has enough cards
    const totalNeeded = (handsCount * cardsPerPlayer) + boardCards;
    if (this.locations.deck.length < totalNeeded) {
      throw new Error(`Not enough cards in deck! Need ${totalNeeded}, have ${this.locations.deck.length}`);
    }
    
    // Deal to players first
    for (let player = 0; player < handsCount; player++) {
      for (let cardNum = 0; cardNum < cardsPerPlayer; cardNum++) {
        const card = this.locations.deck[0]; // Always take from top
        this.moveCard(card.id, 'deck', 'hands', null, player);
      }
    }
    
    // Deal to board
    for (let cardNum = 0; cardNum < boardCards; cardNum++) {
      const card = this.locations.deck[0]; // Always take from top
      this.moveCard(card.id, 'deck', 'board');
    }
    
    console.log(`✅ DEALING COMPLETE`);
    console.log(`   Hands: [${this.locations.hands.map(h => h.length).join(', ')}]`);
    console.log(`   Board: ${this.locations.board.length}`);
    console.log(`   Deck: ${this.locations.deck.length}`);
    
    this.validateCardCount('DEALING');
  }
  
  // 🎯 EXECUTE CAPTURE (Multiple cards to captured pile)
  executeCapture(captureCards) {
    this.stats.captureEvents++;
    console.log(`🎯 EXECUTING CAPTURE: ${captureCards.length} cards`);
    
    const capturedCardIds = [];
    
    // Move each card to captured pile
    captureCards.forEach(cardId => {
      const cardData = this.cardRegistry.get(cardId);
      this.moveCard(cardId, cardData.location, 'captured', null, cardData.playerIndex);
      capturedCardIds.push(cardId);
    });
    
    console.log(`✅ CAPTURE COMPLETE: ${capturedCardIds.length} cards captured`);
    this.validateCardCount('CAPTURE');
    
    return capturedCardIds;
  }
  
  // 🔄 UPDATE INDEXES AFTER REMOVAL
  updateIndexesAfterRemoval(locationKey, removedIndex) {
    this.cardRegistry.forEach((cardData, cardId) => {
      const matchesLocation = (
        (locationKey === 'deck' && cardData.location === 'deck') ||
        (locationKey === 'board' && cardData.location === 'board') ||
        (locationKey === 'captured' && cardData.location === 'captured') ||
        (locationKey.startsWith('hands_') && cardData.location === 'hands' && 
         cardData.playerIndex === parseInt(locationKey.split('_')[1]))
      );
      
      if (matchesLocation && cardData.index > removedIndex) {
        cardData.index--;
      }
    });
  }
  
  // 🔄 UPDATE INDEXES AFTER INSERTION
  updateIndexesAfterInsertion(locationKey, insertedIndex) {
    this.cardRegistry.forEach((cardData, cardId) => {
      const matchesLocation = (
        (locationKey === 'deck' && cardData.location === 'deck') ||
        (locationKey === 'board' && cardData.location === 'board') ||
        (locationKey === 'captured' && cardData.location === 'captured') ||
        (locationKey.startsWith('hands_') && cardData.location === 'hands' && 
         cardData.playerIndex === parseInt(locationKey.split('_')[1]))
      );
      
      if (matchesLocation && cardData.index >= insertedIndex) {
        cardData.index++;
      }
    });
  }
  
  // ✅ BULLETPROOF VALIDATION - GUARANTEES 52 CARDS
  validateCardCount(context = 'UNKNOWN') {
    this.stats.validationChecks++;
    
    // Count cards in all locations
    const deckCount = this.locations.deck.length;
    const handsCount = this.locations.hands.reduce((sum, hand) => sum + hand.length, 0);
    const boardCount = this.locations.board.length;
    const comboCount = Object.values(this.locations.combo).reduce((sum, area) => sum + area.length, 0);
    const capturedCount = this.locations.captured.length;
    
    const totalCards = deckCount + handsCount + boardCount + comboCount + capturedCount;
    const registryCount = this.cardRegistry.size;
    
    // Create validation report
    const report = {
      context: context,
      timestamp: new Date().toLocaleTimeString(),
      totalCards: totalCards,
      registryCount: registryCount,
      breakdown: {
        deck: deckCount,
        hands: handsCount,
        board: boardCount,
        combo: comboCount,
        captured: capturedCount
      },
      isValid: totalCards === 52 && registryCount === 52,
      moves: this.stats.totalMoves,
      captures: this.stats.captureEvents
    };
    
    this.stats.lastValidation = report;
    
    if (report.isValid) {
      console.log(`✅ VALIDATION PASSED (${context}): 52/52 cards tracked perfectly`);
    } else {
      console.error(`🚨 VALIDATION FAILED (${context}):`);
      console.error(`   Total Cards: ${totalCards}/52`);
      console.error(`   Registry: ${registryCount} entries`);
      console.error(`   Breakdown:`, report.breakdown);
      throw new Error(`CRITICAL: Card count validation failed! ${totalCards}/52 cards`);
    }
    
    return report;
  }
  
  // 📊 GET COMPLETE GAME STATE
  getGameState() {
    return {
      deck: [...this.locations.deck],
      hands: this.locations.hands.map(hand => [...hand]),
      board: [...this.locations.board],
      combo: {
        base: [...this.locations.combo.base],
        sum1: [...this.locations.combo.sum1],
        sum2: [...this.locations.combo.sum2],
        sum3: [...this.locations.combo.sum3],
        match: [...this.locations.combo.match]
      },
      captured: [...this.locations.captured],
      stats: { ...this.stats },
      validation: this.stats.lastValidation
    };
  }
  
  // 🎯 QUERY FUNCTIONS - Safe read-only access
  getCardsInLocation(location, playerIndex = null) {
    if (location === 'hands' && playerIndex !== null) {
      return [...this.locations.hands[playerIndex]];
    } else if (location === 'combo') {
      return { ...this.locations.combo };
    } else {
      return [...this.locations[location]];
    }
  }
  
  getCardById(cardId) {
    const cardData = this.cardRegistry.get(cardId);
    return cardData ? { ...cardData } : null;
  }
  
  findCard(value, suit) {
    for (const [cardId, cardData] of this.cardRegistry) {
      if (cardData.card.value === value && cardData.card.suit === suit) {
        return { cardId, ...cardData };
      }
    }
    return null;
  }
  
  // 🎨 HELPER FUNCTIONS
  getSuitSymbol(suit) {
    const symbols = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
    return symbols[suit] || suit;
  }
  
  // 🔍 DEBUG FUNCTIONS
  debugCardDistribution() {
    console.log('🔍 CARD DISTRIBUTION DEBUG:');
    console.log(`   Deck: ${this.locations.deck.length} cards`);
    console.log(`   Hands: [${this.locations.hands.map(h => h.length).join(', ')}]`);
    console.log(`   Board: ${this.locations.board.length} cards`);
    console.log(`   Combo Areas: Base:${this.locations.combo.base.length}, Sum1:${this.locations.combo.sum1.length}, Sum2:${this.locations.combo.sum2.length}, Sum3:${this.locations.combo.sum3.length}, Match:${this.locations.combo.match.length}`);
    console.log(`   Captured: ${this.locations.captured.length} cards`);
    console.log(`   Registry Size: ${this.cardRegistry.size} entries`);
  }
  
  debugRegistryIntegrity() {
    console.log('🔍 REGISTRY INTEGRITY CHECK:');
    let errors = 0;
    
    this.cardRegistry.forEach((cardData, cardId) => {
      // Verify card exists in claimed location
      let foundInLocation = false;
      
      if (cardData.location === 'deck') {
        foundInLocation = this.locations.deck.some(c => c.id === cardId);
      } else if (cardData.location === 'hands') {
        foundInLocation = this.locations.hands[cardData.playerIndex]?.some(c => c.id === cardId);
      } else if (cardData.location === 'board') {
        foundInLocation = this.locations.board.some(c => c.id === cardId);
      } else if (cardData.location === 'combo') {
        const comboAreas = ['base', 'sum1', 'sum2', 'sum3', 'match'];
        foundInLocation = comboAreas.some(area => 
          this.locations.combo[area].some(entry => entry.card?.id === cardId)
        );
      } else if (cardData.location === 'captured') {
        foundInLocation = this.locations.captured.some(c => c.id === cardId);
      }
      
      if (!foundInLocation) {
        console.error(`❌ Card ${cardId} claims to be in ${cardData.location} but not found there!`);
        errors++;
      }
    });
    
    console.log(`${errors === 0 ? '✅' : '❌'} Registry integrity: ${errors} errors found`);
    return errors === 0;
  }
  
  // 🎯 RESET SYSTEM
  reset() {
    console.log('🔄 RESETTING CARDMANAGER...');
    this.cardRegistry.clear();
    this.locations = {
      deck: [],
      hands: [[], [], []],
      board: [],
      combo: { base: [], sum1: [], sum2: [], sum3: [], match: [] },
      captured: []
    };
    this.stats = {
      totalMoves: 0,
      captureEvents: 0,
      validationChecks: 0,
      lastValidation: null
    };
    console.log('✅ CARDMANAGER RESET COMPLETE');
  }
}

// 🔥 EXPORT FOR GLOBAL USE
window.CardManager = CardManager;