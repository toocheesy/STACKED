# Last Capture Display — Move + Fix Formatting

## Two changes, both small.

---

## Change 1: Move Last Capture below the top bar

**Problem:** The `#last-capture-display` is inside `.top-bar-right` and its changing content width causes layout shifts that push things off screen.

**Fix:** Move `#last-capture-display` out of the top bar and position it as a fixed element just below the top bar, so it's visually connected but doesn't affect top bar layout.

### game.html

Find `#last-capture-display` inside `.top-bar-right` (currently around line 82):

```html
<div class="top-bar-right">
  <div class="last-capture-display" id="last-capture-display"></div>
  <span class="target-pill" id="target-score">300 pts</span>
</div>
```

**Remove** the `last-capture-display` div from `.top-bar-right`. Place it as a direct child of `.game-container`, right AFTER the closing `</div>` of `.top-bar`:

```html
    </div>
    <!-- Last Capture (below top bar, independent of layout) -->
    <div class="last-capture-display" id="last-capture-display"></div>

    <!-- Scoreboard Panel... -->
```

### css/styles.css

Find the existing `.last-capture-display` rule and replace it with:

```css
.last-capture-display {
  position: absolute;
  top: var(--topbar-height);
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  background: rgba(26, 15, 8, 0.85);
  border: 1px solid rgba(107, 66, 38, 0.4);
  border-top: none;
  border-radius: 0 0 8px 8px;
  padding: 3px 14px;
  font-family: var(--font-body);
  font-size: 10px;
  color: var(--gold-warm);
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.last-capture-display.visible {
  opacity: 1;
}
```

Also check the tablet/desktop breakpoints — if there are any existing `.last-capture-display` rules in media queries, update the font-size to scale up slightly (e.g. `font-size: 12px` at 1025px+). Remove any old positioning/flex rules that were needed when it lived inside `.top-bar-right`.

---

## Change 2: Fix equals sign in capture format

**Problem:** `showLastCapture()` in main.js joins ALL cards with ` + `. The first card is always the base card, so it should be separated with ` = ` to show "base = captured cards".

Currently: `3♠ + 3♣` (pair) or `10♦ + 4♠ + 6♣` (sum)
Should be: `3♠ = 3♣` (pair) or `10♦ = 4♠ + 6♣` (sum)

### js/main.js

Find `showLastCapture()` (around line 669). The current line is:

```javascript
const cardStr = cards.map(c => c.value + (suitSymbols[c.suit] || '')).join(' + ');
```

Replace with:

```javascript
const cardNames = cards.map(c => c.value + (suitSymbols[c.suit] || ''));
const cardStr = cardNames[0] + ' = ' + cardNames.slice(1).join(' + ');
```

This makes the first card (base) show with ` = ` and the remaining captured cards join with ` + `.

---

## DO NOT TOUCH
- Top bar layout (other than removing the one div)
- Any game logic
- Toast system (separate feature)

## TEST
1. Play a game, let a bot capture → last capture shows centered below top bar as a small banner
2. Format shows "Calvin: 3♠ = 3♣ (10 pts)" for pairs
3. Format shows "Player: 10♦ = 4♠ + 6♣ (15 pts)" for sums
4. Top bar no longer shifts when capture text changes
5. Target pill (300 pts) stays put in top-bar-right
6. Last capture fades in/out smoothly
7. On mobile landscape — banner doesn't overlap game content
