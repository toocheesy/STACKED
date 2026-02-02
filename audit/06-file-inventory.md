# File Inventory & Line Counts

**Updated:** 2026-02-01 (post-cleanup)

## JavaScript Files (Core)

| File | Lines | Purpose |
|------|-------|---------|
| js/main.js | 1,233 | Main controller, event handlers, initialization, HintSystem |
| js/ui.js | 619 | All DOM rendering |
| js/modalManager.js | 541 | Modal dialog system |
| js/gameStateManager.js | 408 | Flow control, turn management |
| js/botModal.js | 333 | Bot move visualization |
| js/game.js | 288 | GameEngine, state management, validation |
| js/cardIntelligence.js | 260 | Strategic AI brain |
| js/speed.js | 242 | Speed mode (coming soon) |
| js/MessageController.js | 217 | Educational guidance messages |
| js/helpers.js | 157 | Utilities, deck, game logic |
| js/classic.js | 81 | Classic mode rules |
| js/modeSelector.js | 57 | Mode management |
| js/ai.js | 36 | AI decision logic |
| js/constants.js | 35 | Shared constants (POINTS_MAP, PLAYER_NAMES, scoring) |

**JS Core Subtotal:** 4,507 lines

## Personality Files (js/personalities/)

| File | Lines | Purpose |
|------|-------|---------|
| js/personalities/rex.js | 263 | Rex AI personality (aggressive, competitive) |
| js/personalities/nina.js | 167 | Nina AI personality (balanced, friendly) |
| js/personalities/calvin.js | 83 | Calvin AI personality (cautious, analytical) |

**Personalities Subtotal:** 513 lines

**JS Total:** 5,020 lines

## JavaScript Files (Adventure — Parked)

| File | Lines | Purpose |
|------|-------|---------|
| js/adventure/adventureMode.js | ~200 | Adventure mode controller |
| js/adventure/levelConfig.js | ~150 | Level definitions |
| js/adventure/progressManager.js | ~120 | Save/load progress |
| js/adventure/worldMap.js | ~100 | Map rendering |

**Adventure Subtotal:** ~570 lines

## CSS Files

| File | Lines | Purpose |
|------|-------|---------|
| css/styles.css | 1,676 | All game styling |
| css/adventure.css | ~200 | Adventure mode styling (parked) |

**CSS Subtotal:** ~1,876 lines

## HTML Files

| File | Lines | Purpose |
|------|-------|---------|
| game.html | 239 | Game page |
| index.html | ~150 | Landing page |
| adventure.html | ~100 | Adventure page (parked) |
| generate-icons.html | ~50 | Dev utility |

**HTML Subtotal:** ~539 lines

## Config & Other

| File | Lines | Purpose |
|------|-------|---------|
| sw.js | 64 | Service worker (v31) |
| manifest.json | 14 | PWA manifest |
| CLAUDE.md | ~255 | Project instructions |
| README.md | ~80 | Documentation |
| .gitignore | ~10 | Git exclusions |

---

## Grand Total: ~8,900 lines across ~35 files

Down from ~10,200 lines / ~38 files after audit cleanup (-1,300 lines, -3 files deleted).
