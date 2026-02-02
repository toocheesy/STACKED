# Dead Code Inventory

## Summary: ~25 dead functions, ~414 dead lines

---

## main.js (~1300 lines)

| Function | Lines | Reason |
|----------|-------|--------|
| `checkGameEnd()` | ~30 lines | Superseded by GameStateManager |
| `handleDropOriginal()` | ~40 lines | Replaced by current drop handler |
| `handleTouchDrop()` | ~40 lines | Replaced by current touch handler |
| HintSystem class | ~200 lines | Embedded in main.js, should be standalone |

Other issues:
- `debugLog()` called at lines 1004/1010 but never defined
- HintSystem has its own inline `pointsMap` (duplicate)

---

## ui.js (724 lines)

| Item | Lines | Reason |
|------|-------|--------|
| `draggableCombo` variable | 1 line | Never used |
| `renderBotComboCard()` | ~30 lines | Called by botModal.js but no visible effect |
| `highlightBotComboArea()` | ~15 lines | Called by botModal.js but no visible effect |
| `cleanupBotComboVisuals()` | ~10 lines | Called by botModal.js but no visible effect |
| `updateMessage()` | ~10 lines | Replaced by MessageController |
| `DEBUG_CONFIG` object | ~5 lines | Never read |

Missing DOM elements (silent failures):
- `#deck-count` — referenced in renderDeckCount()
- `#bot1-hand` — referenced in renderBotHands()
- `#bot2-hand` — referenced in renderBotHands()

---

## game.js (~300 lines)

| Function | Lines | Reason |
|----------|-------|--------|
| `getPlayerName()` | Lines 96-100 | Defined but never called (duplicated inline elsewhere) |

Other issues:
- `state.lastAction` not initialized in constructor
- `getState()` returns shallow copy (mutation risk)

---

## helpers.js (253 lines)

| Item | Lines | Reason |
|------|-------|--------|
| `scoreCards()` | ~5 lines | Never called (calculateScore used instead) |
| Module-level `suits`/`values` | Lines 10-11 | Redefined inside createDeck() |
| `DraggableModal` | ~30 lines | Instantiated with `combination-area` ID — element doesn't exist |

---

## gameStateManager.js (417 lines)

- Contains duplicate `pointsMap` (lines 242-245)
- `state.lastAction` assumed but not initialized in game.js

---

## modalManager.js (~620 lines)

| Item | Lines | Reason |
|------|-------|--------|
| Settings modal type | ~40 lines | Never triggered |
| Hint modal type | ~40 lines | Never triggered |
| Pause modal type | ~40 lines | Never triggered |
| Confirm modal type | ~40 lines | Never triggered |
| `getActiveModalType()` | ~5 lines | Never called |

---

## modeSelector.js (~290 lines)

| Item | Lines | Reason |
|------|-------|--------|
| `createModeSelector()` | ~40 lines | References non-existent `#settings-modal` |
| `setupModeSelection()` | ~30 lines | References non-existent `#settings-modal` |
| `updateDynamicSettings()` | ~30 lines | References non-existent `#settings-modal` |

~35% of file is dead code.

---

## classic.js (~140 lines)

| Function | Reason |
|----------|--------|
| `validateCapture()` | Empty stub, never called |
| `onCapture()` | Empty stub, never called |
| `onRoundEnd()` | Empty stub, never called |
| `onGameEnd()` | Empty stub, never called |
| `getAvailableActions()` | Empty stub, never called |
| `getCustomUI()` | Empty stub, never called |

---

## speed.js (~345 lines)

| Issue | Details |
|-------|---------|
| Timer leak | `setInterval` not cleared on game end |
| Speed bonus | Visual-only — never added to actual score |
| Wrong selector | `.game-container` doesn't match current HTML |

---

## cardIntelligence.js (~330 lines)

| Function | Reason |
|----------|--------|
| `findSafestCardToPlace()` chain | Dead — unreachable code path |
| `debugCardKnowledge()` | Empty function body |

---

## MessageController.js (228 lines)

| Function | Reason |
|----------|--------|
| `hideSecondaryMessage()` | Defined but no longer called (callbacks removed) |
| `forceRefresh()` | Defined but never called |
