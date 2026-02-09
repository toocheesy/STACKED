# Bot Display on Game Screen — CC Prompt

## Overview
Add persistent bot displays to the game screen showing bot name and card count. These sit in the top-left and top-right corners of the main game area, always visible. Players can glance up and instantly see who has how many cards — critical for strategy.

---

## Layout

```
┌──────────────────────────────────────────────────┐
│ [X] [Rules]  TURN INFO / LAST CAPTURE   [300pts] │  ← existing top bar
├──────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────┐                    ┌──────────┐    │
│  │ Calvin   │                    │ Nina     │    │
│  │ 🃏 x 3   │      BOARD        │ 🃏 x 2   │    │
│  └──────────┘                    └──────────┘    │
│                                                    │
│              Board Cards Here                      │
│                                                    │
│              ┌─ Combo Area ──┐                    │
│              │Base│S1│S2│S3  │                    │
│              └───────────────┘                    │
│                                                    │
│              YOUR HAND (4 cards)                   │
└──────────────────────────────────────────────────┘
```

Bot 1 = top-left corner, Bot 2 = top-right corner. Positioned inside `.game-area`, NOT inside the top bar.

---

## STEP 1: Add Bot Display HTML (game.html)

Add two bot display elements inside `.game-area` (or whatever the main game container is):

```html
<div class="bot-display bot-display-left" id="bot1-display">
  <div class="bot-name" id="bot1-name">Calvin</div>
  <div class="bot-cards" id="bot1-cards">🃏 x 4</div>
</div>

<div class="bot-display bot-display-right" id="bot2-display">
  <div class="bot-name" id="bot2-name">Nina</div>
  <div class="bot-cards" id="bot2-cards">🃏 x 4</div>
</div>
```

Place these as direct children of the game area container, near the top.

---

## STEP 2: Style Bot Displays (css/styles.css)

```css
.bot-display {
  position: absolute;
  top: 10px;  /* adjust based on top bar height — should sit just below the top bar */
  z-index: 10;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  padding: 6px 12px;
  text-align: center;
  min-width: 80px;
}

.bot-display-left {
  left: 10px;
}

.bot-display-right {
  right: 10px;
}

.bot-name {
  font-family: var(--font-display);  /* Cinzel */
  color: var(--gold-bright);
  font-size: clamp(10px, 1.5vw, 14px);
  font-weight: 700;
}

.bot-cards {
  font-family: var(--font-body);  /* Outfit */
  color: #F5E8C7;
  font-size: clamp(11px, 1.8vw, 16px);
}
```

### Important styling notes:
- `.game-area` (or parent container) must have `position: relative` for the absolute positioning to work — verify this is already set
- On mobile landscape, make sure the bot displays don't overlap with the board cards or the top bar
- Keep them compact — this is glanceable info, not a dashboard
- Consider a subtle border: `border: 1px solid rgba(255, 215, 0, 0.3)` for the gold accent

---

## STEP 3: Set Bot Names on Game Init (main.js)

When the game initializes and bot pairings are determined, set the display names:

Find where bots are assigned (after reading difficulty from localStorage) and add:

```javascript
document.getElementById('bot1-name').textContent = bot1PersonalityName;  // e.g. "Calvin"
document.getElementById('bot2-name').textContent = bot2PersonalityName;  // e.g. "Nina"
```

Use whatever variable holds the bot personality names — likely from the difficulty→bot pairing mapping.

---

## STEP 4: Update Card Counts (ui.js or main.js)

The card count needs to update every time the game state changes — after every capture, place, and deal.

Create an update function:

```javascript
function updateBotDisplays() {
  const bot1Cards = game.state.hands[1] ? game.state.hands[1].length : 0;
  const bot2Cards = game.state.hands[2] ? game.state.hands[2].length : 0;
  document.getElementById('bot1-cards').textContent = '🃏 x ' + bot1Cards;
  document.getElementById('bot2-cards').textContent = '🃏 x ' + bot2Cards;
}
```

Call `updateBotDisplays()` in these places:
- After `initGame()` / new game start (show initial 4 cards each)
- After every capture (bot's card count may change)
- After every placement (bot played a card, count decreases)
- After every new deal (hands refilled to 4)

Find the existing spots where `ui.renderBoard()` or similar UI updates are called — `updateBotDisplays()` should go right alongside those calls.

### Verify the hand data:
- `game.state.hands[0]` = player's hand
- `game.state.hands[1]` = bot 1's hand
- `game.state.hands[2]` = bot 2's hand

Check game.js to confirm this is correct before implementing.

---

## STEP 5: Active Turn Indicator (optional but nice)

When it's a bot's turn, add a subtle highlight to their display:

```javascript
function highlightActiveBot(playerIndex) {
  document.getElementById('bot1-display').classList.toggle('bot-active', playerIndex === 1);
  document.getElementById('bot2-display').classList.toggle('bot-active', playerIndex === 2);
}
```

```css
.bot-active {
  border: 1px solid var(--gold-bright);
  background: rgba(0, 0, 0, 0.7);
}
```

Call this wherever the current player changes — likely in the turn transition logic.

---

## Mobile Considerations

- On narrow mobile screens, the bot displays should be small enough not to overlap with board cards
- Test in landscape mode (the primary mobile orientation)
- If they overlap with board cards at small sizes, reduce padding and font size
- They should NEVER be hidden on mobile — the whole point is always-visible strategic info

---

## File Summary

| File | Changes |
|------|---------|
| game.html | Add bot display HTML elements |
| css/styles.css | Bot display positioning and styling |
| main.js | Set bot names on init, call updateBotDisplays() |
| ui.js | Add updateBotDisplays() function (or put in main.js) |

## What NOT to change:
- game.js — no game logic changes
- gameStateManager.js — no flow changes
- Bot personality files — no AI changes
- helpers.js — no changes
- Combo builder area — don't touch

## Verification
1. Both bot names show correctly for each difficulty
2. Card counts start at 4 for each bot
3. Card counts decrease as bots play cards
4. Card counts reset to 4 on new deal
5. Displays visible on desktop AND mobile landscape
6. Don't overlap with board cards or top bar
7. Active turn indicator highlights correct bot (if implemented)
8. Card counts show 0 when bot is out of cards
