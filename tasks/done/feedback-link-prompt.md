# Add Feedback Link to Homepage

## What
Add a small "Give Feedback" link on the homepage that opens the Google Form in a new tab. Needs to be visible but not competing with Play buttons.

## Where
- **EDIT:** `index.html` — add link in the right panel footer area

---

## Implementation

Find the footer area of the right panel (the section with the Tournament teaser and help button). Add a feedback link next to or near the help button.

Add this element in the panel footer area:

```html
<a href="https://docs.google.com/forms/d/e/1FAIpQLSdT4Rfrf2UJ3lN6FGt48olNHX7qG4vBXfrTLwytS2v18dM_5w/viewform?usp=header" 
   target="_blank" 
   rel="noopener noreferrer"
   class="feedback-link">
  💬 Feedback
</a>
```

### Styling (inline in index.html since homepage uses inline styles)

```css
.feedback-link {
  color: #8B7355;
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  text-decoration: none;
  letter-spacing: 0.5px;
  transition: color 0.2s ease;
}

.feedback-link:hover {
  color: #D4A44A;
}
```

Place it in the footer row so it sits alongside the existing elements (Tournament teaser, help button). It should feel like a quiet utility link — muted color, small font, not a big button.

---

## DO NOT TOUCH
- Play buttons or difficulty selector
- Any game logic or navigation
- Adventure button or badges
- Help button functionality

## TEST
1. Homepage loads → "💬 Feedback" visible in footer area, muted styling
2. Click it → Google Form opens in new tab
3. Doesn't compete visually with Play Classic or Adventure buttons
4. Responsive — still visible on mobile landscape
