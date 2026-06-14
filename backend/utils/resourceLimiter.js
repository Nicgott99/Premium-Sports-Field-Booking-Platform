/**
 * Resource limiter for managing system resource usage
 */

class ResourceLimiter {
  constructor(options = {}) {
    this.limits = new Map();
    this.usage = new Map();
    this.reservations = new Map();
    this.defaultLimit = options.defaultLimit || 1000;
  }

  /**
   * Set resource limit
   * @param {string} resource - Resource name
   * @param {number} limit - Limit value
   * @param {number} resetInterval - Reset interval in milliseconds
   */
  setLimit(resource, limit, resetInterval = 60000) {
    this.limits.set(resource, {
      limit,
      resetInterval,
      lastReset: Date.now(),
    });

    if (!this.usage.has(resource)) {
      this.usage.set(resource, {
        current: 0,
        peak: 0,
        history: [],
      });
    }
  }

  /**
   * Check if resource is available
   * @param {string} resource - Resource name
   * @param {number} amount - Amount needed
   * @returns {boolean}
   */
  canAllocate(resource, amount = 1) {
    this.resetIfNeeded(resource);

    const limit = this.limits.get(resource);
    if (!limit) {
      return true;
    }

    const usage = this.usage.get(resource);
    return usage && usage.current + amount <= limit.limit;
  }

  /**
   * Allocate resource
   * @param {string} resource - Resource name
   * @param {number} amount - Amount to allocate
   * @returns {object|null}
   */
  allocate(resource, amount = 1) {
    if (!this.canAllocate(resource, amount)) {
      return null;
    }

    const usage = this.usage.get(resource);
    usage.current += amount;
    usage.peak = Math.max(usage.peak, usage.current);

    const reservation = {
      id: `reservation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      resource,
      amount,
      allocatedAt: Date.now(),
    };

    this.reservations.set(reservation.id, reservation);

    return reservation;
  }

  /**
   * Release resource
   * @param {string} reservationId - Reservation ID
   */
  release(reservationId) {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      return false;
    }

    const usage = this.usage.get(reservation.resource);
    if (usage) {
      usage.current = Math.max(0, usage.current - reservation.amount);
    }

    this.reservations.delete(reservationId);
    return true;
  }

  /**
   * Reset if needed
   * @param {string} resource - Resource name
   */
  resetIfNeeded(resource) {
    const limit = this.limits.get(resource);
    if (!limit) return;

    const now = Date.now();
    if (now - limit.lastReset > limit.resetInterval) {
      const usage = this.usage.get(resource);
      if (usage) {
        usage.history.push({
          timestamp: now,
          current: usage.current,
          peak: usage.peak,
        });

        usage.current = 0;
        usage.peak = 0;

        // Keep only last 24 hours of history
        const oneDayAgo = now - 86400000;
        usage.history = usage.history.filter(h => h.timestamp > oneDayAgo);
      }

      limit.lastReset = now;
    }
  }

  /**
   * Get resource usage
   * @param {string} resource - Resource name
   * @returns {object|null}
   */
  getUsage(resource) {
    this.resetIfNeeded(resource);
    return this.usage.get(resource) || null;
  }

  /**
   * Get resource limit
   * @param {string} resource - Resource name
   * @returns {number|null}
   */
  getLimit(resource) {
    const limit = this.limits.get(resource);
    return limit ? limit.limit : null;
  }

  /**
   * Get utilization percentage
   * @param {string} resource - Resource name
   * @returns {number}
   */
  getUtilization(resource) {
    const limit = this.limits.get(resource);
    const usage = this.usage.get(resource);

    if (!limit || !usage) {
      return 0;
    }

    return (usage.current / limit.limit) * 100;
  }

  /**
   * Get all usage statistics
   * @returns {Map}
   */
  getAll() {
    const stats = new Map();

    for (const [resource, usage] of this.usage) {
      const limit = this.limits.get(resource);
      stats.set(resource, {
        limit: limit?.limit || this.defaultLimit,
        current: usage.current,
        peak: usage.peak,
        utilization: (usage.current / (limit?.limit || this.defaultLimit)) * 100,
      });
    }

    return stats;
  }

  /**
   * Get all reservations
   * @returns {array}
   */
  getReservations() {
    return Array.from(this.reservations.values());
  }

  /**
   * Clear resource usage history
   * @param {string} resource - Resource name
   */
  clearHistory(resource) {
    const usage = this.usage.get(resource);
    if (usage) {
      usage.history = [];
    }
  }

  /**
   * Get resource statistics
   * @returns {object}
   */
  getStats() {
    return {
      resources: this.limits.size,
      reservations: this.reservations.size,
      totalUsage: Array.from(this.usage.values()).reduce((sum, u) => sum + u.current, 0),
    };
  }
}

export { ResourceLimiter };

export const resourceLimiter = new ResourceLimiter();

export default ResourceLimiter;
