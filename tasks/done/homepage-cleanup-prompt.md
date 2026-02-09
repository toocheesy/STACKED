# Homepage Cleanup & Pre-Game Modal — CC Prompt

## Overview
Remove difficulty selection from the homepage. Homepage should only show game mode buttons. When player clicks "Classic", a modal pops up for difficulty selection. Add a settings gear icon to the game screen for volume and game speed.

---

## STEP 1: Simplify Homepage (index.html)

Remove all difficulty-related UI from the homepage. The mode selection should be clean and simple:

**Keep these buttons:**
- **Play Classic** — opens the pre-game difficulty modal (don't navigate to game.html yet)
- **Learn to Play** (was Adventure Mode) — navigates to adventure.html as it does now
- **Speed Mode** — keep as "Coming Soon" with the banner

**Remove:**
- Any difficulty selector (Beginner/Intermediate/Legendary) from the homepage
- Any bot name references (Calvin, Nina, Rex) from the homepage
- The difficulty description text

The homepage should feel like: "Pick your mode, go."

---

## STEP 2: Build Pre-Game Modal (index.html)

When the player clicks "Play Classic", show a modal with difficulty selection BEFORE navigating to game.html.

### Modal Content:
```
┌─────────────────────────────────────┐
│         CHOOSE YOUR CHALLENGE       │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🟢 BEGINNER                │   │
│  │  Calvin & Calvin            │   │
│  │  "Learn the ropes"          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🟡 INTERMEDIATE            │   │
│  │  Calvin & Nina              │   │
│  │  "A real challenge"         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🔴 LEGENDARY               │   │
│  │  Nina & Rex                 │   │
│  │  "Only the brave"           │   │
│  └─────────────────────────────┘   │
│                                     │
│           [Cancel]                  │
└─────────────────────────────────────┘
```

### Behavior:
- Each difficulty option is a clickable card/button
- Clicking one navigates to `game.html?difficulty=beginner` (or intermediate/legendary)
- Cancel closes the modal, returns to homepage
- Style the modal to match the existing game aesthetic (wood tones, parchment, Cinzel/Outfit fonts)
- Modal should have a semi-transparent dark overlay behind it

### Difficulty URL params:
- `?difficulty=beginner` → Calvin + Calvin
- `?difficulty=intermediate` → Calvin + Nina  
- `?difficulty=legendary` → Nina + Rex

---

## STEP 3: Read Difficulty in game.html (main.js)

Update the game initialization in main.js to read the difficulty from URL params instead of however it currently gets the difficulty selection.

Find where the difficulty/bot pairing is currently set and change it to:

```javascript
const urlParams = new URLSearchParams(window.location.search);
const difficulty = urlParams.get('difficulty') || 'beginner';
```

Then map to bot pairings:
- beginner → Calvin + Calvin
- intermediate → Calvin + Nina
- legendary → Nina + Rex

**Important:** Don't break the existing bot pairing logic — just change WHERE the difficulty value comes from (URL param instead of homepage selection).

---

## STEP 4: Settings Gear Icon (game.html)

Add a gear icon (⚙️) to the top bar area of game.html. When clicked, opens a settings panel/modal with:

### Settings Panel Content:
- **Volume** — slider (0-100), controls the existing sound system. Default: 50
- **Game Speed** — slider or 3 options (Fast / Normal / Slow)
  - Fast: multiply all bot thinking delays by 0.5x
  - Normal: 1x (current default)  
  - Slow: multiply all bot thinking delays by 2x

### Speed Implementation:
The bot thinking delays come from `getThinkingDelay()` in helpers.js. Add a global speed multiplier:

```javascript
// In helpers.js or a new config location
let gameSpeedMultiplier = 1.0; // 0.5 = fast, 1.0 = normal, 2.0 = slow
```

Multiply the delay returned by `getThinkingDelay()` by this multiplier.

### Volume Implementation:
There should already be a sound toggle. Convert it to a volume slider that sets the gain/volume of all sound effects.

### Settings Persistence:
Save both settings to localStorage so they persist between games:
- `stacked_volume` 
- `stacked_speed`

### Styling:
- Small gear icon, muted color, doesn't compete with gameplay
- Settings panel slides in or appears as a small modal
- Match existing game aesthetic
- Close button or click-outside-to-close

---

## File Summary

| File | Changes |
|------|---------|
| index.html | Remove difficulty UI, add pre-game modal |
| main.js | Read difficulty from URL params |
| helpers.js | Add gameSpeedMultiplier to getThinkingDelay() |
| game.html | Add settings gear icon + settings panel |
| css/styles.css | Styles for modal + settings panel + gear icon |

## What NOT to change:
- game.js — no game logic changes
- gameStateManager.js — no flow changes  
- Bot personality files — no AI changes
- Adventure mode files — no changes
- ui.js — no rendering changes (unless gear icon needs to go through ui.js)
