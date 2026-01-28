# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

STACKED! is a browser-based strategic card game where 1 human plays against 2 AI bots. Players capture cards using a unique 5-area combo system. First to 500 points wins.

**Live Site:** https://stacked-orcin.vercel.app/
**Tech Stack:** Vanilla JavaScript ES6+ (no frameworks), CSS3, HTML5

## Development

No build step required - this is a static web project.

```bash
# Local development - use any static server
npx serve
# or Python
python -m http.server 8000
```

Open `index.html` for homepage or `game.html` directly to play.

**Deployment:** Vercel with auto-deploy on push to main.

---

## SACRED GAME RULES (DO NOT BREAK)

### The Golden Rule
- **CAPTURE = Turn continues** (player can capture again)
- **PLACE = Turn ends immediately** (no exceptions)

### 5-Area Combo Builder
- **Base Card** (required) - sets target value, can come from hand OR board
- **Sum1, Sum2, Sum3** - cards that ADD UP to base value
- **Match** - cards with SAME value as base

### Capture Requirements
- Every capture needs cards from BOTH hand AND board
- Face cards (K, Q, J) can ONLY make pairs, NEVER sums
- Aces = 1 in sums, but worth 15 points for scoring

### Scoring
- Aces: 15 pts | K, Q, J, 10: 10 pts | 2-9: 5 pts each

### End Conditions
- Deal new hands when: all players out of cards AND deck has 12+ cards
- "Last Combo Takes All" - final capturer gets remaining board cards
- Game ends when: deck empty + someone reaches 500 points

---

## LOCKED DECISIONS (DO NOT CHANGE)

1. **Vanilla JavaScript** - No frameworks
2. **5-Area Combo System** - Base + Sum1/Sum2/Sum3 + Match
3. **Turn Flow** - Capture continues, Place ends
4. **GameStateManager** - Single source of truth for game flow
5. **Face Card Rule** - K, Q, J pairs only, no sums

---

## CRITICAL: Script Loading Order

Scripts in `game.html` MUST load in this exact sequence:

```
1. helpers.js          - Utilities (deck, game logic, sounds)
2. cardIntelligence.js - AI strategic brain
3. gameStateManager.js - Game flow controller
4. modalManager.js     - Modal system
5. game.js             - GameEngine core
6. modeSelector.js     - Mode management
7. MessageController.js - Educational guidance
8. classic.js/speed.js - Game modes
9. ai.js/botModal.js   - AI systems
10. ui.js              - Rendering
11. main.js            - MUST BE LAST (initializes everything)
```

---

## Architecture

### Core Systems

**GameStateManager** (`gameStateManager.js`): Ultimate authority on game flow. Returns: `CONTINUE_TURN`, `DEAL_NEW_HAND`, `END_ROUND`, `END_GAME`, or `ERROR`. All flow decisions go through `determineGameState()`.

**GameEngine** (`game.js`): Pure data layer - deck, board, hands, scores, combination state. Mode-agnostic.

**UISystem** (`ui.js`): All DOM rendering. Delegates modals to ModalManager.

**BotModalInterface** (`botModal.js`): AI plays through same visual interface as humans (no direct state manipulation - prevents card corruption).

### Game Flow Pattern

```
1. Player/Bot action (capture or place)
2. game.state.lastAction = 'capture' or 'place'
3. gameStateManager.determineGameState(game) called
4. handleGameStateResult() in main.js handles response
5. Capture → same player continues | Place → next player
```

### Combination State Structure

```javascript
game.state.combination = {
  base: [],   // Exactly 1 card required for valid capture
  sum1: [],   // Cards summing to base value
  sum2: [],
  sum3: [],
  match: []   // Cards matching base value (pairs)
}
```

### Global Objects

All systems exposed via `window.`:
- `window.gameStateManager`
- `window.cardIntelligence`
- `window.messageController`
- `window.gameIsPaused` (controls input during modals)

---

## File Reference

| File | Purpose |
|------|---------|
| `main.js` | Main controller, event handlers, initialization |
| `game.js` | GameEngine, state management, validation |
| `gameStateManager.js` | Flow control, turn management |
| `ai.js` | AI decision logic |
| `cardIntelligence.js` | Strategic AI brain, difficulty levels |
| `botModal.js` | Bot move visualization |
| `ui.js` | Rendering, DOM manipulation |
| `helpers.js` | Deck, game logic, utilities, sounds |
| `MessageController.js` | Educational guidance messages |
| `modalManager.js` | Modal dialogs |
| `classic.js` | Classic mode rules (active) |
| `speed.js` | Speed mode (coming soon) |

---

## Common Issues & Debugging

- **Game freezes**: Check `lastAction` is being set in main.js before `determineGameState()`
- **Cards disappearing**: Check `isCardInPlayArea()` in ui.js
- **Bot score animation wrong**: Verify points match between capture logic and animation
- **Jackpot not showing**: Look for double `checkGameEnd()` calls overwriting message
- **Debug logging**: Set `debugMode = true` in gameStateManager.js or ui.js

---

## Developer Notes

TC (the developer) prefers:
- Specific explanations of what's changing and why
- One change at a time with testing between
- Targeted code sections rather than full file rewrites for small changes

**Dangerous Areas** (be careful): `gameStateManager.js`, turn logic in `main.js`, capture validation in `game.js`

**Safe Areas**: `styles.css`, `MessageController.js`, AI tuning in `ai.js`

---

## Git

Repository: https://github.com/toocheesy/STACKED.git
Push to main triggers Vercel deploy.
