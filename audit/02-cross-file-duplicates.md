# Cross-File Duplicate Analysis

## 1. POINTS MAPPING — 7 Definitions

| File | Location | Values |
|------|----------|--------|
| helpers.js | Lines 71-85 | A:15, K:10, Q:10, J:10, 10:10, 9:5...2:5 |
| game.js | Lines 254-257 | Same (inline in calculateScore) |
| classic.js | Lines 19-33 | Same |
| speed.js | Lines 29-43 | **DIFFERENT**: A:20, K:15, Q:15...2:10 |
| gameStateManager.js | Lines 242-245 | Same as helpers (inline) |
| main.js | Lines 115-118 | Same as helpers (inline in HintSystem) |
| adventureMode.js | Lines 23-26 | Same as helpers |

### Personality files with `_pointValue()`:

| File | Location |
|------|----------|
| calvin.js | Lines 73-77 |
| nina.js | Line 165+ |
| rex.js | Line 261+ |

All three are identical: A:15, K/Q/J/10:10, others:5.

**Speed mode uses 25% inflated scoring** — unclear if intentional or bug.

---

## 2. PLAYER NAMES ARRAY — 4 Locations

`['Player', 'Bot 1', 'Bot 2']` hardcoded in:

| File | Location |
|------|----------|
| classic.js | Lines 54-55 |
| gameStateManager.js | Lines 216-217, 347, 355 |
| speed.js | Lines 192-193 |
| game.js | Lines 96-100 (has `getPlayerName()` but unused) |

---

## 3. SCORING CALCULATION — 5 Implementations

Pattern: `cards.reduce((total, card) => total + (pointsMap[card.value] || 0), 0)`

Files: helpers.js (176), game.js (258), classic.js (42), speed.js (138), adventureMode.js (62)

Plus personality files use `_pointValue()` aggregation pattern.

---

## 4. JACKPOT LOGIC — Triple Calculation

`applyLastComboTakesAll()` exists in:
- classic.js (lines 46-69)
- speed.js (lines 185-210)
- gameStateManager.js `applyJackpot()` (lines 209-238)

GameStateManager calculates independently; modes also calculate. Triple work.

---

## 5. GLOBAL VARIABLE CONFLICTS

| window property | Assigned in |
|-----------------|-------------|
| `window.DraggableModal` | helpers.js (253) AND main.js (1128) — **duplicate** |
| `window.gameStateManager` | gameStateManager.js (414) |
| `window.cardIntelligence` | cardIntelligence.js (330) |
| `window.messageController` | MessageController.js (226) |
| `window.gameIsPaused` | main.js (set/unset 4 times) |
| `window.hintSystem` | main.js (1020) |
| `window.resumeNextRound` | main.js (1271) |

---

## 6. RECOMMENDED FIX

Create `js/constants.js` (load first, before helpers.js):

```javascript
const POINTS_MAP = { 'A': 15, 'K': 10, 'Q': 10, 'J': 10, '10': 10, '9': 5, '8': 5, '7': 5, '6': 5, '5': 5, '4': 5, '3': 5, '2': 5 };
const PLAYER_NAMES = ['Player', 'Bot 1', 'Bot 2'];
function calculateScore(cards) {
  return cards.reduce((total, card) => total + (POINTS_MAP[card.value] || 0), 0);
}
```

Then remove all duplicates from 10+ files.
