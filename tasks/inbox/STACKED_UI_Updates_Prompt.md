# UI UPDATES - Multiple changes across Adventure Mode and Game Screen

## 1. ADVENTURE MODE (adventure.css / worldMap.js)

Make level cards stretch to fill the available width evenly within each world.
Currently they sit centered with awkward whitespace on the right.
Levels should distribute across the full width of the world container.

---

## 2. GAME SCREEN - Last Capture (css/styles.css + ui.js if needed)

Move the "LAST CAPTURE" display to be horizontally centered on the screen.
Currently it's positioned near the bot displays. Center it prominently.

---

## 3. GAME SCREEN - Remove Scores Sidebar (css/styles.css + ui.js)

Remove the "SCORES" tab on the left side of the game screen entirely.
We're relocating score display elsewhere.

---

## 4. GAME SCREEN - Bot Score Display (css/styles.css + ui.js)

Update the bot corner boxes to include their score. New layout:

```
┌─────────────┐
│  CALVIN #1  │
│  3 cards    │
│  45 pts     │
└─────────────┘
```

- Name on top
- Card count in middle  
- Score (points) on bottom
- Apply to both bot displays (top-left and top-right)

---

## 5. GAME SCREEN - Player Score Box (css/styles.css + ui.js)

Add a score display box for the player, positioned to the LEFT of "YOUR HAND".

Something like:

```
┌──────────┐
│ 30 pts   │
└──────────┘  [YOUR HAND: card card card card]
```

Style it to match the game's aesthetic (similar to bot boxes but for player).

---

After making changes, list what files were modified so I can test.
