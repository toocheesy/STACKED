# TASK: Fix Last Capture Display — Positioning and Format

## Two Issues:

### 1. Positioning
The Last Capture bar is overlapping the right bot box (Calvin #2) and the message area. It needs to be centered horizontally in the game area, sitting cleanly between the two bot boxes without overlapping anything.

### 2. Capture Format
Currently shows: `Player: 8♥ = 8♦ (10 pts)`

Change the format so:
- `=` separates the base card from captured cards
- `+` separates multiple captured cards
- Examples:
  - Pair: `Player: 8♥ = 8♦ (10 pts)`
  - Sum: `Player: 8♥ = 6♣ + 2♦ (15 pts)`
  - Multi-card sum: `Player: 9♠ = 4♥ + 3♦ + 2♣ (15 pts)`

Find wherever the Last Capture text string gets built and update the formatting logic. The base card goes first, then `=`, then captured cards joined by ` + `, then the point value in parentheses.

## Files likely involved
main.js or ui.js — wherever the last capture display text gets constructed and wherever the element is positioned/styled, plus styles.css for the centering fix.

## Don't break
Bot corner boxes, message area, or any game logic. This is display-only.
