// debug.js
export function logDebug(...args) {
  if (typeof window !== 'undefined' && window.state?.settings?.debugMode) {
    console.log('[DEBUG]', ...args);
  }
}