import logger from './logger.js';

/**
 * Event emitter and event bus for application-wide event handling
 */

class EventEmitter {
  constructor() {
    this.events = new Map();
    this.middlewares = [];
    this.history = [];
    this.maxHistory = 1000;
  }

  /**
   * Register event listener
   * @param {string} eventName - Event name
   * @param {function} handler - Event handler
   * @param {object} options - Handler options
   * @returns {function} Unsubscribe function
   */
  on(eventName, handler, options = {}) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const listener = { handler, once: options.once || false, priority: options.priority || 0 };
    this.events.get(eventName).push(listener);

    // Sort by priority
    this.events.get(eventName).sort((a, b) => b.priority - a.priority);

    logger.debug(`Event listener registered: ${eventName}`);

    // Return unsubscribe function
    return () => this.off(eventName, handler);
  }

  /**
   * Register one-time listener
   * @param {string} eventName - Event name
   * @param {function} handler - Event handler
   * @returns {function} Unsubscribe function
   */
  once(eventName, handler) {
    return this.on(eventName, handler, { once: true });
  }

  /**
   * Unregister listener
   * @param {string} eventName - Event name
   * @param {function} handler - Event handler
   */
  off(eventName, handler) {
    if (!this.events.has(eventName)) return;

    const listeners = this.events.get(eventName);
    const index = listeners.findIndex(l => l.handler === handler);

    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Emit event
   * @param {string} eventName - Event name
   * @param {*} data - Event data
   * @returns {Promise} Emit result
   */
  async emit(eventName, data) {
    const event = {
      name: eventName,
      data,
      timestamp: new Date(),
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Store in history
    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    logger.debug(`Event emitted: ${eventName}`);

    if (!this.events.has(eventName)) {
      return { success: true, listeners: 0 };
    }

    const listeners = [...this.events.get(eventName)];
    const results = [];

    for (const listener of listeners) {
      try {
        // Run middlewares
        let shouldContinue = true;
        for (const middleware of this.middlewares) {
          const result = await middleware(event);
          if (result === false) {
            shouldContinue = false;
            break;
          }
        }

        if (!shouldContinue) continue;

        // Call handler
        await listener.handler(data);
        results.push({ success: true });

        // Remove if once
        if (listener.once) {
          this.off(eventName, listener.handler);
        }
      } catch (error) {
        logger.error(`Event handler error: ${eventName}`, error);
        results.push({ success: false, error: error.message });
      }
    }

    return { success: true, listeners: results.length };
  }

  /**
   * Register middleware
   * @param {function} fn - Middleware function
   */
  use(fn) {
    this.middlewares.push(fn);
  }

  /**
   * Get event listeners
   * @param {string} eventName - Event name
   * @returns {array} Listeners
   */
  listeners(eventName) {
    return this.events.get(eventName) || [];
  }

  /**
   * Get listener count
   * @param {string} eventName - Event name
   * @returns {number} Count
   */
  listenerCount(eventName) {
    return this.listeners(eventName).length;
  }

  /**
   * Get all events
   * @returns {array} Event names
   */
  eventNames() {
    return Array.from(this.events.keys());
  }

  /**
   * Remove all listeners
   * @param {string} eventName - Event name (optional)
   */
  removeAllListeners(eventName) {
    if (eventName) {
      this.events.delete(eventName);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get event history
   * @param {string} eventName - Event name (optional)
   * @returns {array} History
   */
  getHistory(eventName) {
    if (eventName) {
      return this.history.filter(e => e.name === eventName);
    }
    return this.history;
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * Get bus stats
   * @returns {object} Statistics
   */
  getStats() {
    return {
      events: this.events.size,
      listeners: Array.from(this.events.values())
        .reduce((sum, listeners) => sum + listeners.length, 0),
      historySize: this.history.length,
      middlewares: this.middlewares.length,
    };
  }
}

export const eventBus = new EventEmitter();

export default eventBus;
