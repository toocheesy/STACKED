/* 
 * 🎯 BOTMODAL.JS - MINIMAL STUB (LEGACY COMPATIBILITY)
 * This file now just provides backward compatibility
 * All real functionality moved to aiSystem.js
 * 🔥 PHASE 2: This file can be deleted entirely
 */

class BotModalInterface {
  constructor(gameEngine, uiSystem) {
    // Legacy constructor - does nothing
    // Real functionality is in AISystem now
    console.log('🔄 BotModal stub created - AI functionality in AISystem');
  }

  // 🔄 LEGACY: Forward to AISystem for backward compatibility
  async executeCapture(move, playerIndex) {
    console.log('🔄 BotModal forwarding executeCapture to AISystem');
    return await AISystem.executeCapture(move, playerIndex);
  }

  async placeCard(handCard, playerIndex) {
    console.log('🔄 BotModal forwarding placeCard to AISystem');
    return await AISystem.placeCard(handCard, playerIndex);
  }

  // 🔄 LEGACY: Other methods that might be called
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  debugCardState() {
    console.log('🔄 BotModal forwarding debugCardState to AISystem');
    if (AISystem && AISystem.debugCardState) {
      AISystem.debugCardState(this.game);
    }
  }
}

// Export for backward compatibility
window.BotModalInterface = BotModalInterface;

console.log('🔄 BOTMODAL STUB LOADED - All functionality moved to AISystem');