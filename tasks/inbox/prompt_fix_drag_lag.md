# Fix the two lag sources

---

## Fix 1: Keep GPU layer alive during drag

In `css/styles.css`, change the `.card.dragging` rule from:

```css
.card.dragging {
    transition: none !important;
    transform: none !important;
}
```

To:

```css
.card.dragging {
    transition: none !important;
    transform: translateZ(0) !important;
}
```

---

## Fix 2: Add missing passive:false to touchend listeners

In `ui.js`, update these three listeners to include `{ passive: false }`:

- **Line 238** (touchend on combo card)
- **Line 583** (touchend on hand card)
- **Line 596** (touchend on empty slot)

Each should look like:

```javascript
element.addEventListener('touchend', handler, { passive: false });
```

Match the pattern already used by touchstart/touchmove on those same elements.

---

## Test after:

Drag should feel instant now, especially in Safari. Try:
1. Quick drags
2. Slow drags
3. Drag and release mid-screen (should snap back with no lag)
