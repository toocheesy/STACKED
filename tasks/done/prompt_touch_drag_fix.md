# Fix touch drag issues - lag and snap-back

Based on your investigation, implement these fixes:

---

## Fix 1: Eliminate drag lag

**In `css/styles.css`**, add a new class (put it near the other card styles, around line 1295):

```css
.card.dragging {
    transition: none !important;
    transform: none !important;
}
```

**In `main.js` `handleTouchStart()`** (around line 830-850):
- Add the `.dragging` class to the card element being dragged
- Find where the card element is identified and add:
```javascript
cardElement.classList.add('dragging');
```

**In `main.js` `handleTouchEnd()`** (around line 911, early in the function):
- Remove the `.dragging` class from the card before any other logic:
```javascript
if (touchDragData.element) {
    touchDragData.element.classList.remove('dragging');
}
```

---

## Fix 2: Snap-back on invalid drop

**In `main.js` `handleTouchEnd()`**, after the board drop check (around line 950), add an else clause:

```javascript
else {
    // Invalid drop - re-render to snap card back to original position
    if (window.ui && typeof window.ui.renderAll === 'function') {
        window.ui.renderAll(game);
    }
}
```

**Also update the `elementBelow === null` case** (lines 932-934) to include the same snap-back:

```javascript
if (!elementBelow) {
    touchDragData = {};
    touchStartPosition = null;
    // Add this line:
    if (window.ui && typeof window.ui.renderAll === 'function') {
        window.ui.renderAll(game);
    }
    return;
}
```

---

## Test after implementation:

1. Drag a card halfway and lift finger → should snap back instantly
2. Drag should feel immediate with no lag
3. Normal valid drops should still work as before
