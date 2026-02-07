# STACKED!

A strategic card game where you play against 2 AI opponents. Capture cards using a combo system of pairs and sums. First to 300 points wins.

**Play it:** [https://stackedthegame.com](https://stackedthegame.com)

## How to Play

1. Pick a difficulty (Beginner / Intermediate / Legendary)
2. Click "Play Classic" to start
3. Each turn you either **capture** cards or **place** a card on the board

### Combo System

Build captures using 4 areas:

- **Base** - your target card (from hand or board)
- **Combo 1 / 2 / 3** - cards that match or sum to the base value

**Capture = your turn continues.** Place = your turn ends.

### Scoring

| Cards | Points |
|-------|--------|
| Aces | 15 |
| K, Q, J, 10 | 10 |
| 2-9 | 5 |

Face cards (K, Q, J) can only make pairs, never sums.

When the round ends, the last player to capture takes all remaining board cards (the "jackpot").

## Running Locally

No build step. Serve the files with anything:

```bash
npx serve
# or
python -m http.server 8000
```

Open `index.html` for the landing page or `game.html` to jump straight into a game.

## Tech Stack

- Vanilla JavaScript ES6+ (no frameworks)
- CSS3
- HTML5
- Hosted on Vercel

## Project Structure

```
js/
  main.js             - Game controller, event handling, initialization
  game.js             - GameEngine: deck, board, hands, scores, validation
  gameStateManager.js - Turn flow decisions (single source of truth)
  ui.js               - DOM rendering
  ai.js               - AI move decisions
  cardIntelligence.js - AI card memory and strategy
  botModal.js         - Bot move visualization (plays through the UI)
  helpers.js          - Deck creation, shuffle, utilities
  MessageController.js - In-game hint/guidance messages
  modalManager.js     - Modal dialogs (game over, round end, etc.)
  modeSelector.js     - Game mode management
  classic.js          - Classic mode rules
  speed.js            - Speed mode (not yet active)
css/
  styles.css          - All styling
```

## Architecture

- **GameStateManager** controls all flow decisions. After every action it returns `CONTINUE_TURN`, `DEAL_NEW_HAND`, `END_ROUND`, `END_GAME`, or `ERROR`.
- **GameEngine** is the pure data layer - no UI, no flow logic.
- **BotModalInterface** makes bots play through the same visual combo interface as the human player.
- Scripts must load in a specific order in `game.html` (see CLAUDE.md for details).
