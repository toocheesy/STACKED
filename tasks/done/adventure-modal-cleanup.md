# TASK: Remove generic "How to Play" modal from Adventure Mode

## Problem
When starting an Adventure Mode game, two modals appear back-to-back:
1. Generic "How to Play" rules modal (with capture rules, points, tips)
2. Level-specific intro modal (e.g. "Pair Valley — First Match" with level-appropriate instructions)

This is redundant and clunky. The level intro modal already contains everything the player needs for that specific level.

## Fix
When the game is launched in Adventure Mode, skip the generic "How to Play" modal entirely. Only show the level-specific intro modal.

Classic Mode should continue showing the "How to Play" modal as it does now — no changes there.

## Logic
Find where the "How to Play" modal gets triggered on game start. Add a condition: if the game was launched in Adventure Mode, don't show it. The level intro modal (from adventureMode.js or levelConfig.js) handles the instructions for that level.

## Files likely involved
- main.js or modalManager.js — wherever the "How to Play" modal gets triggered on game load
- adventure/adventureMode.js — may already have its own modal trigger, just needs the generic one suppressed

## Don't break
- Classic Mode "How to Play" modal (should still work normally)
- Adventure level intro modals (should still appear as they do now)
- Any other modal flows (scoreboard, rules button, etc.)
