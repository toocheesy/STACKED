# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

STACKED! is a browser-based strategic card game where 1 human plays against 2 AI bots. Players capture cards using a 4-area combo system. First to 300 points wins.

**Live Site:** https://stackedthegame.com  
**Tech Stack:** Vanilla JavaScript ES6+ (no frameworks), CSS3, HTML5

## Development

No build step required - static web project.

```bash
# Local development - use any static server
npx serve
# or Python
python -m http.server 8000
```

Open `index.html` for homepage or `game.html` directly to play.

**Deployment:** Vercel (push to main triggers deploy)

---

## Workflow Orchestration

### 1. Plan Mode Default

For ANY non-trivial task (3+ steps or touching Dangerous Areas):
- Write plan to `tasks/todo.md` with checkable items
- Get TC approval before starting implementation
- If something goes sideways, STOP and re-plan — don't keep pushing
- Mark items complete as you go

### 2. Subagent Strategy

Use subagents liberally to keep main context clean:
- Offload research, exploration, and parallel analysis to subagents
- One task per subagent for focused execution
- Use for: checking how other files handle similar patterns, testing theories, analyzing multiple files at once

### 3. Self-Improvement Loop

After ANY correction from TC, update `tasks/lessons.md` with:
```
## [Date] - [Brief description]
**What went wrong:** [specifics]
**Rule to prevent it:** [the lesson]
```

Review `tasks/lessons.md` at session start for relevant project. Ruthlessly iterate until mistake rate drops.

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Run the game, check console, demonstrate correctness
- Ask yourself: "Would this survive TC's family playing it?"

### 5. Autonomous Bug Fixing

When given a bug report: just fix it. Don't ask for hand-holding.
- Point at logs, errors, failing behavior — then resolve them
- Zero context switching required from TC
- If you break something else fixing it, you fix that too

---

## SACRED GAME RULES (DO NOT BREAK)

### The Golden Rule
- **CAPTURE = Turn continues** (player can capture again)
- **PLACE = Turn ends immediately** (no exceptions)

### 4-Area Combo Builder
- **Base Card** (required) - sets target value, can come from hand OR board
- **Combo 1, Combo 2, Combo 3** - cards that add up to OR match base value (pairs and sums both accepted in any slot)

### Capture Requirements
- Every capture needs cards from BOTH hand AND board
- Face cards (K, Q, J) can ONLY make pairs, NEVER sums
- Aces = 1 in sums, but worth 15 points for scoring

### Scoring
- Aces: 15 pts | K, Q, J, 10: 10 pts | 2-9: 5 pts each

### End Conditions
- Deal new hands when: all players out of cards AND deck has 12+ cards
- "Last Combo Takes All" - final capturer gets remaining board cards
- Game ends when: deck empty + someone reaches 300 points

---

## LOCKED DECISIONS (DO NOT CHANGE)

1. **Vanilla JavaScript** - No frameworks, ever
2. **4-Area Combo System** - Base + Combo 1/2/3 (all slots accept pairs and sums)
3. **Turn Flow** - Capture continues, Place ends
4. **GameStateManager** - Single source of truth for game flow
5. **Face Card Rule** - K, Q, J pairs only, no sums

---

## CRITICAL: Script Loading Order

Scripts in `game.html` MUST load in this exact sequence:

```
1. helpers.js          - Constants, deck, game logic, AI routing
2. cardIntelligence.js - AI strategic brain
3. personalities/*.js  - Calvin, Nina, Rex
4. gameStateManager.js - Game flow controller
5. modalManager.js     - Modal system
6. game.js             - GameEngine core
7. modeSelector.js     - Mode management
8. MessageController.js - Educational guidance
9. classic.js/speed.js - Game modes
10. adventure/*.js     - Level config, progress, adventure mode
11. botModal.js        - Bot move visualization
12. ui.js              - Rendering
13. main.js            - MUST BE LAST (initializes everything, includes HintSystem)
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
  sum1: [],   // Combo 1 - accepts pairs or sums
  sum2: [],   // Combo 2
  sum3: [],   // Combo 3
  match: []   // Match area - pairs only
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

| File | Purpose | Risk Level |
|------|---------|------------|
| `main.js` | Main controller, event handlers, initialization | ⚠️ DANGEROUS |
| `game.js` | GameEngine, state management, validation | ⚠️ DANGEROUS |
| `gameStateManager.js` | Flow control, turn management | ⚠️ DANGEROUS |
| `cardIntelligence.js` | Strategic AI brain, difficulty levels | ✅ Safe |
| `botModal.js` | Bot move visualization | Moderate |
| `ui.js` | All DOM rendering | Moderate |
| `helpers.js` | Constants, deck, game logic, AI routing | ✅ Safe |
| `MessageController.js` | Educational guidance messages | ✅ Safe |
| `modalManager.js` | Modal dialog system | ✅ Safe |
| `modeSelector.js` | Mode management | ✅ Safe |
| `classic.js` | Classic mode rules | Moderate |
| `speed.js` | Speed mode (coming soon) | ✅ Safe |
| `styles.css` | All styling | ✅ Safe |
| `personalities/*.js` | AI personalities | ✅ Safe |
| `adventure.html` | Adventure mode entry point, world map page | ✅ Safe |
| `adventure/adventureMode.js` | Per-level config, integrates adventure into game engine | Moderate |
| `adventure/levelConfig.js` | 18 levels across 6 worlds, difficulty & learning objectives | ✅ Safe |
| `adventure/progressManager.js` | localStorage progress tracking, stars, unlocks | ✅ Safe |
| `adventure/worldMap.js` | World map UI renderer, navigation between worlds/levels | ✅ Safe |
| `css/adventure.css` | Adventure mode world map styling | ✅ Safe |

**Dangerous Areas require plan approval before touching.**

---

## Common Issues & Debugging

- **Game freezes**: Check `lastAction` is being set in main.js before `determineGameState()`
- **Cards disappearing**: Check `isCardInPlayArea()` in ui.js
- **Bot score animation wrong**: Verify points match between capture logic and animation
- **Jackpot not showing**: Look for double `checkGameEnd()` calls overwriting message
- **Debug logging**: Set `debugMode = true` in gameStateManager.js or ui.js

---

## Working with TC

TC prefers:
- Specific explanations of what's changing and why
- One change at a time with testing between
- Targeted code sections rather than full file rewrites
- Direct communication, no corporate tone
- Just fix shit when you can — don't ask permission for obvious fixes

TC works warehouse and codes on breaks. Time is limited. Get to the point.

---

## Git

Repository: https://github.com/toocheesy/STACKED.git

### Branch Strategy (DO NOT VIOLATE)

| Branch | Purpose | When to touch |
|--------|---------|---------------|
| `main` | LIVE production — family plays this | ONLY when TC says "merge to main" or "deploy" |
| `dev` | Staging for fixes & polish | Default working branch |
| `adventure-mode` | Future feature (parked) | Only when TC explicitly says so |

- **Default branch:** Always `dev` unless told otherwise
- **NEVER push directly to `main`** without explicit deploy instruction
- Push to `main` triggers Vercel deploy

---

## CSS Architecture

Mobile-first CSS custom properties system (on `adventure-mode`, pending merge):
- `:root` variables define all sizes (cards, slots, grid, fonts)
- 2 breakpoints only: `1025px+` (tablet/desktop) and `1440px+` (ultra-wide)
- Zero `!important` overrides — all sizing via `var()`
- `ui.js` reads `--slot-card-offset`, `--slot-h`, `--board-shift-per-row` from CSS

---

## Task Management Files

| File / Directory | Purpose |
|------------------|---------|
| `tasks/todo.md` | Current task plan with checkable items |
| `tasks/lessons.md` | Accumulated learnings from corrections |
| `tasks/inbox/` | Incoming task prompts and specs from TC |
| `tasks/done/` | Completed task files (moved from inbox after implementation) |

Create these files if they don't exist when needed.

---

## Soft Launch Reference

See `stacked_soft_launch_checklist.md` for:
- Hotfix vs batch decision guide
- Reddit response templates
- Success metrics
- Weekly deploy rhythm
