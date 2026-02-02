# HTML & CSS Audit

## game.html (239 lines)

### IDs: 36 total — all valid
### Classes: 61 total
### Inline handlers: 1 (consider moving to JS)

### Missing DOM Elements (referenced in JS but not in HTML):

| ID | Referenced in | Impact |
|----|---------------|--------|
| `#deck-count` | ui.js renderDeckCount() | Silent failure — deck count never displays |
| `#bot1-hand` | ui.js renderBotHands() | Silent failure — bot hands not rendered |
| `#bot2-hand` | ui.js renderBotHands() | Silent failure — bot hands not rendered |
| `#combination-area` | helpers.js DraggableModal | DraggableModal breaks silently |

---

## css/styles.css (1677 lines)

### Stats:
- 95 class selectors
- 45+ CSS custom properties
- 33 media queries
- 3 breakpoint tiers: base (mobile), 1025px+ (tablet/desktop), 1440px+ (ultra-wide)

### Architecture:
- Mobile-first with `:root` custom properties
- Zero `!important` overrides
- All sizing via `var()` — clean system

### Duplicate:
- `.rotate-overlay` defined in both `styles.css` and `adventure.css`

### Media Query Breakdown:
- Landscape mobile queries (max-height based)
- Tablet/desktop (min-width: 1025px)
- Ultra-wide (min-width: 1440px)
- Print query (1 instance)

### No Issues Found:
- All class selectors match HTML usage
- Custom properties properly cascaded through breakpoints
- No orphaned selectors detected

---

## index.html

- Landing page
- Links to game.html
- Proper favicon/manifest setup
- No issues found
