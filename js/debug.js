// debug.js
export function debugLog(...args) {
  if (window.state?.settings?.debugMode) {
    console.log('[DEBUG]', ...args);
  }
}
