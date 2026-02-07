# Toast Notification System — CC Prompt

**WHAT THIS IS:** A lightweight toast notification system that shows floating feedback messages during gameplay. Player actions only — never for bot turns.

---

## NEW FILE: `js/toastManager.js` (~50-60 lines)

Create a toast manager that:
1. Exposes a global function `showToast(message, type)`
2. Creates a DOM element, animates it (float up + fade out), removes it after animation
3. Supports multiple toasts stacking if they fire close together (offset each one so they don't overlap)
4. Types: `'points'`, `'combo'`, `'sweep'`, `'milestone'`

### Toast behavior:
- Appears center of `.game-area` (the left/main play area, NOT the combo panel)
- Floats upward ~40px while fading from full opacity to 0
- Duration: 1.8s total (0.1s fade in, 1.2s hold, 0.5s fade out + float)
- Auto-removes from DOM after animation completes
- If multiple toasts fire, stack them vertically with ~30px gap so they don't overlap

---

## TOAST STYLING — Add to `css/styles.css`

```css
.toast-notification {
  position: absolute;
  left: 50%;
  top: 45%;
  transform: translateX(-50%);
  z-index: 100;
  pointer-events: none;
  font-family: var(--font-display);
  font-weight: 900;
  letter-spacing: 1px;
  text-align: center;
  white-space: nowrap;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  animation: toast-float 1.8s ease-out forwards;
}

.toast-points {
  font-size: 20px;
  color: var(--gold-bright);
}

.toast-combo {
  font-size: 24px;
  color: #FF6B35;
}

.toast-sweep {
  font-size: 28px;
  color: #FF4444;
}

.toast-milestone {
  font-size: 22px;
  color: var(--gold-bright);
}

@keyframes toast-float {
  0% { opacity: 0; transform: translateX(-50%) translateY(0); }
  6% { opacity: 1; transform: translateX(-50%) translateY(0); }
  70% { opacity: 1; transform: translateX(-50%) translateY(-20px); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-40px); }
}
```

Scale font sizes down proportionally in existing mobile breakpoints if needed.

---

## TRIGGER WIRING — in `main.js`

Find where the **PLAYER's** capture is processed and points are awarded. This is the key part — you need to identify the exact spot where:
1. A capture is confirmed as valid
2. The points for that capture are calculated
3. The current player is confirmed to be the human (not Calvin/Nina/Rex)

**Important:** Only fire toasts when it's the human player's capture. Check however the game identifies the current player — likely checking `game.state.currentPlayer` or similar against player index 0 or a `'player'` string.

At that point, fire these toasts:

```javascript
// After player capture scores points:
showToast(`+${points} pts`, 'points');

// If the capture used 2+ combo slots (multi-card capture):
showToast('Nice combo!', 'combo');

// If the capture used 3+ combo slots:
showToast('HUGE combo!', 'combo');

// If it's a sweep (last combo takes all / board cleared):
showToast('SWEEP!', 'sweep');

// If player crosses 150 points:
showToast('Halfway there!', 'milestone');

// If player crosses 250 points:
showToast('Almost there!', 'milestone');
```

The points toast and combo toast CAN fire together on the same capture — they'll stack.

For milestones, only fire once per threshold per game. Track with a simple flag:
```javascript
// At game start, reset milestone flags
window._toastMilestones = { half: false, almost: false };

// When checking after points awarded:
if (playerScore >= 150 && !window._toastMilestones.half) {
  showToast('Halfway there!', 'milestone');
  window._toastMilestones.half = true;
}
if (playerScore >= 250 && !window._toastMilestones.almost) {
  showToast('Almost there!', 'milestone');
  window._toastMilestones.almost = true;
}
```

---

## SCRIPT TAG — Add to `game.html`

Add `<script src="js/toastManager.js"></script>` in the script loading order — load it **BEFORE** `main.js` but **AFTER** `ui.js`.

---

## POSITIONING REQUIREMENT

Make sure `.game-area` has `position: relative` if it doesn't already. The toasts use `position: absolute` inside `.game-area`.

---

## DO NOT TOUCH
- Bot turn logic — no toasts for bots, ever
- Game scoring logic — just read the point values, don't change how scoring works
- Any other UI systems
- The combo builder or card interactions

---

## TEST
1. Play a game, make a capture → see "+X pts" float up from center of play area and fade
2. Make a multi-card combo → see both points toast AND "Nice combo!" stacked
3. Use 3+ combo slots → see "HUGE combo!" instead
4. Clear the board or trigger sweep → see "SWEEP!"
5. Cross 150 points → see "Halfway there!" (only once)
6. Cross 250 points → see "Almost there!" (only once)
7. Bot captures → NO toasts appear
8. Multiple toasts at once → they stack vertically, don't overlap
