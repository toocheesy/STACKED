# Lessons Learned

## 2026-02-12 — Bot capture audit flagged false positives as dead code
**What went wrong:** Subagent audit reported `handleDropOriginal`, `showLastCapture`, `resetRenderFlags` as dead code. All three were actively used — just called indirectly or via `window.` globals.
**Rule to prevent it:** Always grep for BOTH the function name AND `window.functionName` before declaring something dead. Indirect references through `window.` are common in this codebase.

## 2026-02-12 — canCapture() pair/sum duplication
**What went wrong:** Single-card sum check (`boardItem.value === handValue`) duplicated pair results. Every pair showed up twice — once as pair type, once as sum type.
**Rule to prevent it:** When writing capture/match logic with multiple detection paths, explicitly exclude already-matched cases. If pairs are handled above, the sum loop must skip exact value matches.

## 2026-02-12 — Adventure mode has TWO capture validation gates
**What went wrong:** Fixed the adventure filter in `main.js` (gate 1) but bot captures still failed because `game.validateCapture()` (gate 2) rejected pairs placed in `sum1` slot. Took multiple debug rounds to find.
**Rule to prevent it:** When debugging a blocked flow, trace the ENTIRE pipeline end-to-end before declaring it fixed. Adventure mode validates at: (1) `main.js` filterBotCapture, (2) `game.validateCapture()` during submit. Both must pass.

## 2026-02-12 — Combo slot routing is not cosmetic
**What went wrong:** `botModal.js` dumped all legacy captures into `sum1`. Adventure mode's `pairsOnly` restriction requires `areaName === 'match'` for pairs. Putting pairs in `sum1` = instant rejection.
**Rule to prevent it:** Slot routing must match capture type: pairs → `match`, sums → `sum1/sum2/sum3`. This matters for adventure mode validation even though classic mode is permissive.

## 2026-02-12 — Service worker cache list must match actual files
**What went wrong:** `/js/ai.js` was still in `ASSETS_TO_CACHE` after being consolidated into `helpers.js`. Caused `addAll` to fail silently, breaking the entire cache install.
**Rule to prevent it:** When consolidating or deleting JS files, always check `sw.js` ASSETS_TO_CACHE and bump the cache version.

## 2026-02-12 — Google Drive + Git repos don't mix
**What went wrong:** `.tmp.driveupload/` junk files appearing, potential lock file conflicts across machines.
**Rule to prevent it:** Keep git repos on local drives, sync through GitHub. Never put a `.git` directory inside a Drive-synced folder.
