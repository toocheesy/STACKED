# Asset & Config Inventory

## Images & Icons

| File | Location | Used in | Status |
|------|----------|---------|--------|
| favicon.ico | Root | game.html, index.html, sw.js | Used |
| favicon-16x16.png | Root | game.html, index.html, sw.js | Used |
| favicon-32x32.png | Root | game.html, index.html, sw.js | Used |
| apple-touch-icon.png | icons/ | game.html, index.html, sw.js | Used |
| icon-192x192.png | icons/ | manifest.json, index.html, sw.js | Used |
| icon-512x512.png | icons/ | manifest.json, sw.js | Used |

**Audio Files:** None (correctly removed previously)

---

## Service Worker Cache (sw.js — v31)

32 items cached (added constants.js). **All verified present.** No orphaned entries, no missing files.

### Not cached (intentionally):
- adventure.html, css/adventure.css, js/adventure/* — parked feature, not deployed

---

## manifest.json — VALID

- Icons: Both referenced files exist
- start_url: /index.html (correct)
- display: standalone, orientation: landscape
- Theme/background colors match

---

## Config Files

| File | Status |
|------|--------|
| manifest.json | Valid |
| sw.js | Valid, v31 |
| .gitignore | Standard, no issues |
| CLAUDE.md | Comprehensive, accurate (updated 2026-02-01) |
| README.md | Accurate (fixed 2026-02-01) |

---

## Script Loading Order (game.html) — CORRECT

Matches CLAUDE.md specification exactly:
1. helpers.js → 2. cardIntelligence.js → 3. personalities (calvin, nina, rex) → 4. gameStateManager.js → 5. modalManager.js → 6. game.js → 7. modeSelector.js → 8. MessageController.js → 9. classic.js → 10. speed.js → 11. ai.js → 12. botModal.js → 13. ui.js → 14. main.js (LAST)

---

## Orphaned Files

| File | Status | Action |
|------|--------|--------|
| `nul` | 0-byte Windows artifact | Delete |
| `_saved_message_features.js` | Unused backup file | Delete or archive |
| `generate-icons.html` | Dev utility, untracked | Keep or delete |

---

## Untracked (Parked Feature)

- adventure.html
- css/adventure.css
- js/adventure/ (4 files: adventureMode.js, levelConfig.js, progressManager.js, worldMap.js)

These are for the adventure-mode branch. Not deployed, intentionally untracked on dev.
