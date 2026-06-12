import logger from './logger.js';

/**
 * State machine implementation for managing state transitions
 */

class StateMachine {
  constructor(initialState, states = {}) {
    this.state = initialState;
    this.states = states;
    this.transitions = new Map();
    this.onEnter = new Map();
    this.onExit = new Map();
    this.history = [{ state: initialState, timestamp: new Date() }];
    this.metadata = {};
  }

  /**
   * Define transition
   * @param {string} from - From state
   * @param {string} to - To state
   * @param {string} event - Event name
   * @param {function} guard - Guard condition (optional)
   */
  transition(from, to, event, guard = null) {
    const key = `${from}:${event}`;
    this.transitions.set(key, { from, to, event, guard });
  }

  /**
   * Register enter hook
   * @param {string} state - State name
   * @param {function} handler - Enter handler
   */
  onEnterState(state, handler) {
    if (!this.onEnter.has(state)) {
      this.onEnter.set(state, []);
    }
    this.onEnter.get(state).push(handler);
  }

  /**
   * Register exit hook
   * @param {string} state - State name
   * @param {function} handler - Exit handler
   */
  onExitState(state, handler) {
    if (!this.onExit.has(state)) {
      this.onExit.set(state, []);
    }
    this.onExit.get(state).push(handler);
  }

  /**
   * Trigger event
   * @param {string} event - Event name
   * @param {object} context - Event context
   * @returns {Promise} Transition result
   */
  async trigger(event, context = {}) {
    const key = `${this.state}:${event}`;
    const transition = this.transitions.get(key);

    if (!transition) {
      logger.warn(`No transition found: ${key}`);
      return { success: false, error: 'No transition' };
    }

    // Check guard condition
    if (transition.guard && !transition.guard(context)) {
      logger.debug(`Guard prevented transition: ${key}`);
      return { success: false, error: 'Guard prevented' };
    }

    const fromState = this.state;
    const toState = transition.to;

    try {
      // Call exit hooks
      const exitHandlers = this.onExit.get(fromState) || [];
      for (const handler of exitHandlers) {
        await handler(context);
      }

      // Change state
      this.state = toState;
      this.history.push({ state: toState, timestamp: new Date(), event });

      // Call enter hooks
      const enterHandlers = this.onEnter.get(toState) || [];
      for (const handler of enterHandlers) {
        await handler(context);
      }

      logger.info(`State transition: ${fromState} -> ${toState} (${event})`);
      return { success: true, fromState, toState };
    } catch (error) {
      // Revert state
      this.state = fromState;
      logger.error(`Transition failed: ${key}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current state
   * @returns {string} Current state
   */
  getCurrentState() {
    return this.state;
  }

  /**
   * Check if in state
   * @param {string} state - State name
   * @returns {boolean}
   */
  isInState(state) {
    return this.state === state;
  }

  /**
   * Get available transitions
   * @returns {array} Available transitions
   */
  getAvailableTransitions() {
    const transitions = [];
    for (const [key, transition] of this.transitions) {
      if (key.startsWith(`${this.state}:`)) {
        transitions.push(transition);
      }
    }
    return transitions;
  }

  /**
   * Get state history
   * @returns {array} History
   */
  getHistory() {
    return this.history;
  }

  /**
   * Reset state
   * @param {string} state - New state
   */
  reset(state) {
    this.state = state;
    this.history = [{ state, timestamp: new Date() }];
  }

  /**
   * Set metadata
   * @param {string} key - Key
   * @param {*} value - Value
   */
  setMetadata(key, value) {
    this.metadata[key] = value;
  }

  /**
   * Get metadata
   * @param {string} key - Key
   * @returns {*} Value
   */
  getMetadata(key) {
    return this.metadata[key];
  }

  /**
   * Get state machine info
   * @returns {object} Info
   */
  getInfo() {
    return {
      currentState: this.state,
      availableTransitions: this.getAvailableTransitions().length,
      historyLength: this.history.length,
      metadata: this.metadata,
    };
  }
}

export { StateMachine };

export default StateMachine;
