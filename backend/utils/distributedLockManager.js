/**
 * Distributed lock manager for coordinating access across instances
 */

class DistributedLockManager {
  constructor(options = {}) {
    this.locks = new Map();
    this.ttl = options.ttl || 30000;
    this.pollInterval = options.pollInterval || 100;
    this.maxWait = options.maxWait || 60000;
  }

  /**
   * Acquire lock
   * @param {string} key - Lock key
   * @param {string} owner - Lock owner
   * @returns {Promise<boolean>}
   */
  async acquire(key, owner) {
    const lockData = this.locks.get(key);

    if (!lockData || Date.now() > lockData.expiresAt) {
      this.locks.set(key, {
        owner,
        acquiredAt: Date.now(),
        expiresAt: Date.now() + this.ttl,
      });
      return true;
    }

    return false;
  }

  /**
   * Wait for lock
   * @param {string} key - Lock key
   * @param {string} owner - Lock owner
   * @returns {Promise<boolean>}
   */
  async waitForLock(key, owner) {
    const startTime = Date.now();

    while (Date.now() - startTime < this.maxWait) {
      if (await this.acquire(key, owner)) {
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, this.pollInterval));
    }

    return false;
  }

  /**
   * Release lock
   * @param {string} key - Lock key
   * @param {string} owner - Lock owner
   * @returns {boolean}
   */
  release(key, owner) {
    const lockData = this.locks.get(key);

    if (lockData && lockData.owner === owner) {
      this.locks.delete(key);
      return true;
    }

    return false;
  }

  /**
   * Check if lock is held
   * @param {string} key - Lock key
   * @returns {boolean}
   */
  isLocked(key) {
    const lockData = this.locks.get(key);

    if (!lockData) {
      return false;
    }

    if (Date.now() > lockData.expiresAt) {
      this.locks.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get lock info
   * @param {string} key - Lock key
   * @returns {object|null}
   */
  getLockInfo(key) {
    const lockData = this.locks.get(key);

    if (!lockData) {
      return null;
    }

    if (Date.now() > lockData.expiresAt) {
      this.locks.delete(key);
      return null;
    }

    return {
      owner: lockData.owner,
      acquiredAt: new Date(lockData.acquiredAt),
      expiresAt: new Date(lockData.expiresAt),
      duration: lockData.expiresAt - lockData.acquiredAt,
    };
  }

  /**
   * Refresh lock
   * @param {string} key - Lock key
   * @param {string} owner - Lock owner
   * @returns {boolean}
   */
  refresh(key, owner) {
    const lockData = this.locks.get(key);

    if (lockData && lockData.owner === owner) {
      lockData.expiresAt = Date.now() + this.ttl;
      return true;
    }

    return false;
  }

  /**
   * Execute with lock
   * @param {string} key - Lock key
   * @param {string} owner - Owner
   * @param {function} fn - Function to execute
   * @returns {Promise}
   */
  async executeWithLock(key, owner, fn) {
    if (!(await this.acquire(key, owner))) {
      throw new Error(`Could not acquire lock: ${key}`);
    }

    try {
      return await fn();
    } finally {
      this.release(key, owner);
    }
  }

  /**
   * Cleanup expired locks
   */
  cleanup() {
    const now = Date.now();
    let count = 0;

    for (const [key, data] of this.locks) {
      if (now > data.expiresAt) {
        this.locks.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Get all locks
   * @returns {array}
   */
  getAllLocks() {
    const now = Date.now();
    const locks = [];

    for (const [key, data] of this.locks) {
      if (now <= data.expiresAt) {
        locks.push({ key, ...data });
      }
    }

    return locks;
  }

  /**
   * Clear all locks
   */
  clear() {
    const size = this.locks.size;
    this.locks.clear();
    return size;
  }
}

export { DistributedLockManager };

export const distributedLockManager = new DistributedLockManager();

export default DistributedLockManager;
