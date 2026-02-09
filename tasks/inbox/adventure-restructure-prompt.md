# Adventure Mode World Restructure — CC Prompt

## Overview
Restructure Adventure Mode to introduce new characters across worlds 1-4, and show worlds 5-6 as visually locked. No monetization logic — just a "Coming Soon" or locked visual state.

---

## CHARACTER ROSTER (for reference)

Current bots built: Calvin, Nina, Rex
New characters (NOT built yet — use placeholder personality files that clone closest existing bot):

| Character | Title | Tier | Placeholder Base |
|-----------|-------|------|-----------------|
| Calvin | The Calculator | Novice | Already exists |
| Talia | The Teacher | Intermediate | Clone Nina's logic |
| Nina | The Natural | Intermediate | Already exists |
| Rex | The Gambler | Advanced | Already exists |
| Jett | The Blitz | Advanced | Clone Rex's logic |
| Mira | The Guardian | Advanced | Clone Rex's logic |

Worlds 5-6 characters (NOT needed yet):
- Marcus, The Shark (Expert)
- Sage, The Zen (Expert)
- Ajax, The Adaptive (Legend)
- Vera, The Genius (Legend)

---

## STEP 1: Create Placeholder Personality Files

Create these new files in `js/personalities/`:

### js/personalities/talia.js
- Copy nina.js as the base
- Change all references from "Nina" to "Talia"
- Change title/description to "The Teacher"
- Change dialogue lines to be encouraging/teaching-focused (examples below)
- Keep the same strategy logic for now — we'll differentiate later

Talia dialogue examples:
- On capture: "See how that works? Nice move!"
- On big combo: "That's the strategy — you're getting it!"
- On player's turn: "Take your time, think about what adds up."
- On losing: "Great game! You've really improved."

### js/personalities/jett.js
- Copy rex.js as the base
- Change all references from "Rex" to "Jett"
- Change title/description to "The Blitz"
- Change dialogue to be fast/impatient/competitive
- Keep same strategy logic for now

Jett dialogue examples:
- On capture: "Too slow! Already got it."
- On big combo: "Boom. Didn't even see that coming, did you?"
- On player's turn: "Tick tock..."
- On losing: "Lucky. Run it back."

### js/personalities/mira.js
- Copy rex.js as the base
- Change all references from "Rex" to "Mira"
- Change title/description to "The Guardian"
- Change dialogue to be calm/defensive/strategic
- Keep same strategy logic for now

Mira dialogue examples:
- On capture: "I'll take that, thank you."
- On big combo: "Patience pays off."
- On player's turn: "I'm watching every move you make."
- On losing: "Well played. You found the gap."

---

## STEP 2: Register New Personalities

In whatever file handles personality routing (check helpers.js around line 182-212 where getAIPersonality maps names to objects):

- Add talia, jett, mira to the personality map
- Make sure getThinkingDelay() has entries for them:
  - Talia: 1.5-2.5s (patient, teacher pace)
  - Jett: 0.8-1.5s (fast, impatient)
  - Mira: 2.0-3.0s (slow, deliberate)

---

## STEP 3: Add Script Tags (game.html)

Add script tags for the new personality files in game.html, in the same section as the existing personality scripts:

```html
<script src="js/personalities/talia.js"></script>
<script src="js/personalities/jett.js"></script>
<script src="js/personalities/mira.js"></script>
```

Same loading order rules as existing personality files.

---

## STEP 4: Restructure levelConfig.js

Replace the current 18-level config with this new structure. Worlds 1-4 are playable, worlds 5-6 are defined but marked as locked.

### World 1: Pair Valley (Tutorial — Meet Calvin)
Calvin is your guide here. Learning the basics.

| Level | Name | Target | Bots | Areas | Special |
|-------|------|--------|------|-------|---------|
| 1-1 | First Match | 30 | Calvin + Calvin | Match only | Pairs only, no sums |
| 1-2 | Pair Pro | 40 | Calvin + Calvin | Match only | Pairs only, no sums |

### World 2: Sum Springs (Learn Sums — Meet Talia)
Talia the Teacher shows you how sums work.

| Level | Name | Target | Bots | Areas | Special |
|-------|------|--------|------|-------|---------|
| 2-1 | Adding Up | 40 | Calvin + Talia | Base + Sum1 | No Sum2, no Sum3 |
| 2-2 | Double Trouble | 50 | Talia + Talia | Base + Sum1 + Sum2 | No Sum3 |
| 2-3 | Full Power | 60 | Talia + Calvin | All areas | First time all areas unlocked |

### World 3: Combo Canyon (Real Competition — Meet Nina)
Nina brings real strategy. Things get serious.

| Level | Name | Target | Bots | Areas | Special |
|-------|------|--------|------|-------|---------|
| 3-1 | The Natural | 75 | Calvin + Nina | All areas | None |
| 3-2 | Combo Breaker | 100 | Nina + Talia | All areas | None |
| 3-3 | Canyon King | 150 | Nina + Nina | All areas | None |

### World 4: Strategy Summit (Advanced — Meet Rex, Jett, Mira)
Three new opponents, three different styles.

| Level | Name | Target | Bots | Areas | Special |
|-------|------|--------|------|-------|---------|
| 4-1 | The Gambler | 150 | Nina + Rex | All areas | None |
| 4-2 | Blitz Attack | 200 | Jett + Nina | All areas | None |
| 4-3 | The Wall | 200 | Mira + Rex | All areas | None |
| 4-4 | Summit Showdown | 250 | Jett + Mira | All areas | Boss level |

### World 5: Legend's Lair (LOCKED)
| Level | Name | Target | Bots | Areas | Special |
|-------|------|--------|------|-------|---------|
| 5-1 | Dragon's Gate | 250 | Rex + Mira | All areas | None |
| 5-2 | Fire Trial | 300 | Rex + Rex | All areas | None |
| 5-3 | Legend Born | 300 | Rex + Rex | All areas | None |

### World 6: Champion's Arena (LOCKED)
| Level | Name | Target | Bots | Areas | Special |
|-------|------|--------|------|-------|---------|
| 6-1 | Arena Entry | 300 | Rex + Rex | All areas | None |
| 6-2 | Title Fight | 350 | Rex + Rex | All areas | None |
| 6-3 | Grand Champion | 400 | Rex + Rex | All areas | None |

**Note:** Worlds 5-6 use Rex + Rex as placeholder. When Marcus, Sage, Ajax, Vera are built later, these will be updated with the real characters.

### Level Config Format:
Each level should include a `locked` property:
```javascript
{
  world: 5,
  level: 1,
  name: "Dragon's Gate",
  locked: true,  // NEW PROPERTY
  // ... rest of config
}
```

Worlds 1-4: `locked: false`
Worlds 5-6: `locked: true`

---

## STEP 5: Update World Map UI (adventure/worldMap.js)

### Locked World Visual Treatment:
- Worlds with ALL levels locked should appear visually dimmed/grayed out
- Show a lock icon (🔒) over the world
- Show "Coming Soon" text under the world name
- Clicking a locked world does nothing (or shows a brief message like "New challengers arriving soon...")
- Do NOT show a price or purchase prompt — just "Coming Soon"

### Character Introduction:
When a player enters a world for the first time, show the new character:
- World 1: "Meet Calvin, The Calculator"
- World 2: "Meet Talia, The Teacher"  
- World 3: "Meet Nina, The Natural"
- World 4: "Meet Rex, Jett, and Mira"

This can be a simple modal/overlay before the first level of each world. Just character name, title, and a one-line intro quote:
- Calvin: "H-hey! I'm still learning too. Let's figure this out together!"
- Talia: "Welcome! I'll show you some new tricks. Pay attention!"
- Nina: "Hope you've been practicing. I don't go easy."
- Rex: "You made it this far? Let's see if you can handle the real game."
- Jett: "Fast hands win games. Try to keep up."
- Mira: "I've been watching you play. I know your weaknesses."

---

## STEP 6: Update Progress Manager

In `adventure/progressManager.js`:
- Make sure locked levels can't be started (even via URL manipulation)
- Progress should stop at World 4 completion
- Star ratings and completion tracking unchanged

---

## File Summary

| File | Changes |
|------|---------|
| js/personalities/talia.js | NEW — clone of Nina with Talia dialogue |
| js/personalities/jett.js | NEW — clone of Rex with Jett dialogue |
| js/personalities/mira.js | NEW — clone of Rex with Mira dialogue |
| helpers.js | Add talia, jett, mira to personality map + thinking delays |
| game.html | Add 3 new script tags |
| js/adventure/levelConfig.js | Complete restructure — new levels, targets, bot pairings |
| js/adventure/worldMap.js | Locked world visuals + character intro modals |
| js/adventure/progressManager.js | Respect locked flag |

## What NOT to change:
- game.js — no game logic changes
- gameStateManager.js — no flow changes
- main.js — no changes (adventure uses its own init)
- Classic mode — unaffected
- Existing calvin.js, nina.js, rex.js — don't modify

## Verification
1. Worlds 1-4 playable, worlds 5-6 show locked with "Coming Soon"
2. New characters (Talia, Jett, Mira) load and play without errors
3. Character intro modal shows when entering each world for first time
4. Correct bot pairings for every level
5. Target scores create short games in worlds 1-2 (1-2 hands)
6. Locked worlds can't be bypassed
7. Progress saves correctly across all 4 playable worlds
8. World map looks clean with locked worlds visually distinct
