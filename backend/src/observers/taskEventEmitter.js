const logger = require('../utils/logger');

class TaskEventEmitter {
  constructor() {
    this.listeners = new Map();
    this.MAX_LISTENERS_PER_EVENT = 100;
  }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    const set = this.listeners.get(event);
    
    // FIX: Prevent memory leak by limiting listeners per event
    if (set.size >= this.MAX_LISTENERS_PER_EVENT) {
      logger.warn(`Max listeners (${this.MAX_LISTENERS_PER_EVENT}) exceeded for event: ${event}. Ignoring new listener.`);
      return () => {}; // Return no-op cleanup function
    }
    
    set.add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(handler);
      // Clean up empty event sets to prevent memory bloat
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event, payload) {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of set) {
      try {
        handler(payload);
      } catch (err) {
        logger.error(`[TaskEventEmitter] listener error for ${event}: ${err.message}`);
      }
    }
  }

  reset() {
    this.listeners.clear();
  }
  
  // Add method to get listener count for monitoring
  getListenerCount(event) {
    return this.listeners.get(event)?.size || 0;
  }
  
  getTotalListeners() {
    let total = 0;
    for (const set of this.listeners.values()) {
      total += set.size;
    }
    return total;
  }
}

module.exports = new TaskEventEmitter();