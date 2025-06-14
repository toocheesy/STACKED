// debug.js
export function debugLog(...args) {
  if (typeof window !== 'undefined' && window.state?.settings?.debugMode) {
    console.log('[DEBUG]', ...args);
  }
}