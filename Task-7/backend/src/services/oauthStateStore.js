import crypto from 'crypto';

/**
 * In-memory OAuth state registry for CSRF protection and single-use state enforcement.
 * Enforces a strict 10-minute TTL and prevents state reuse.
 */
class OAuthStateStore {
  constructor(ttlMs = 10 * 60 * 1000) {
    this.states = new Map();
    this.ttlMs = ttlMs;
  }

  /**
   * Generate a cryptographically secure 32-byte hex state bound to a specific user
   * @param {string} userId - Authenticated student ID
   * @returns {string} 64-character hex state
   */
  generateState(userId) {
    this.cleanExpired();

    const state = crypto.randomBytes(32).toString('hex');
    this.states.set(state, {
      userId: String(userId),
      createdAt: Date.now(),
      consumed: false,
    });

    return state;
  }

  /**
   * Validate and immediately consume state to prevent replay attacks.
   * @param {string} state - Returned OAuth state string
   * @returns {{ valid: boolean, error?: string, userId?: string }}
   */
  validateAndConsumeState(state) {
    if (!state || typeof state !== 'string' || state.length !== 64) {
      return { valid: false, error: 'MALFORMED_STATE' };
    }

    const record = this.states.get(state);

    if (!record) {
      return { valid: false, error: 'STATE_NOT_FOUND' };
    }

    // Check expiration
    if (Date.now() - record.createdAt > this.ttlMs) {
      this.states.delete(state);
      return { valid: false, error: 'STATE_EXPIRED' };
    }

    // Check if already consumed (prevent replay attacks)
    if (record.consumed) {
      this.states.delete(state);
      return { valid: false, error: 'STATE_ALREADY_USED' };
    }

    // Immediately mark consumed and delete
    record.consumed = true;
    this.states.delete(state);

    return { valid: true, userId: record.userId };
  }

  /**
   * Remove expired states
   */
  cleanExpired() {
    const now = Date.now();
    for (const [state, record] of this.states.entries()) {
      if (now - record.createdAt > this.ttlMs) {
        this.states.delete(state);
      }
    }
  }

  /**
   * Clear all states (for unit tests)
   */
  clear() {
    this.states.clear();
  }
}

export const oauthStateStore = new OAuthStateStore();
export default oauthStateStore;

