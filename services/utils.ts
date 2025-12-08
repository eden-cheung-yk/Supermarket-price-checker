
/**
 * Generates a unique ID.
 * Falls back to Math.random if crypto.randomUUID is not available (e.g. on HTTP NAS).
 */
export const generateId = (): string => {
  // Check if crypto is available and secure
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback if context is not secure
    }
  }
  // Fallback implementation
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
