/**
 * Database transaction helper for managing transactions safely
 */

class DatabaseTransactionHelper {
  constructor(db) {
    this.db = db;
    this.transactions = new Map();
    this.savepoints = new Map();
  }

  /**
   * Begin transaction
   * @param {string} isolationLevel - Isolation level
   * @returns {Promise<string>} Transaction ID
   */
  async begin(isolationLevel = 'READ_COMMITTED') {
    const txnId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      if (isolationLevel) {
        await this.db.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
      }

      await this.db.query('BEGIN');

      this.transactions.set(txnId, {
        id: txnId,
        startedAt: Date.now(),
        status: 'active',
        savepoints: [],
      });

      return txnId;
    } catch (error) {
      throw new Error(`Failed to begin transaction: ${error.message}`);
    }
  }

  /**
   * Commit transaction
   * @param {string} txnId - Transaction ID
   * @returns {Promise}
   */
  async commit(txnId) {
    const txn = this.transactions.get(txnId);
    if (!txn) {
      throw new Error(`Transaction not found: ${txnId}`);
    }

    if (txn.status !== 'active') {
      throw new Error(`Transaction not active: ${txnId}`);
    }

    try {
      await this.db.query('COMMIT');
      txn.status = 'committed';
      this.transactions.delete(txnId);
    } catch (error) {
      throw new Error(`Failed to commit transaction: ${error.message}`);
    }
  }

  /**
   * Rollback transaction
   * @param {string} txnId - Transaction ID
   * @returns {Promise}
   */
  async rollback(txnId) {
    const txn = this.transactions.get(txnId);
    if (!txn) {
      throw new Error(`Transaction not found: ${txnId}`);
    }

    try {
      await this.db.query('ROLLBACK');
      txn.status = 'rolled_back';
      this.transactions.delete(txnId);
    } catch (error) {
      throw new Error(`Failed to rollback transaction: ${error.message}`);
    }
  }

  /**
   * Create savepoint
   * @param {string} txnId - Transaction ID
   * @param {string} name - Savepoint name
   * @returns {Promise}
   */
  async savepoint(txnId, name) {
    const txn = this.transactions.get(txnId);
    if (!txn) {
      throw new Error(`Transaction not found: ${txnId}`);
    }

    try {
      await this.db.query(`SAVEPOINT ${name}`);
      txn.savepoints.push(name);
    } catch (error) {
      throw new Error(`Failed to create savepoint: ${error.message}`);
    }
  }

  /**
   * Rollback to savepoint
   * @param {string} txnId - Transaction ID
   * @param {string} name - Savepoint name
   * @returns {Promise}
   */
  async rollbackToSavepoint(txnId, name) {
    const txn = this.transactions.get(txnId);
    if (!txn) {
      throw new Error(`Transaction not found: ${txnId}`);
    }

    try {
      await this.db.query(`ROLLBACK TO ${name}`);
      const index = txn.savepoints.indexOf(name);
      if (index > -1) {
        txn.savepoints.splice(index, 1);
      }
    } catch (error) {
      throw new Error(`Failed to rollback to savepoint: ${error.message}`);
    }
  }

  /**
   * Execute operation with transaction
   * @param {function} operation - Operation to execute
   * @param {string} isolationLevel - Isolation level
   * @returns {Promise}
   */
  async executeWithTransaction(operation, isolationLevel = 'READ_COMMITTED') {
    const txnId = await this.begin(isolationLevel);

    try {
      const result = await operation(txnId, this);
      await this.commit(txnId);
      return result;
    } catch (error) {
      try {
        await this.rollback(txnId);
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      throw error;
    }
  }

  /**
   * Execute batch operation with transaction
   * @param {array} operations - Operations to execute
   * @returns {Promise<array>}
   */
  async executeBatch(operations) {
    const txnId = await this.begin();
    const results = [];

    try {
      for (const operation of operations) {
        const result = await operation(txnId, this);
        results.push(result);
      }

      await this.commit(txnId);
      return results;
    } catch (error) {
      await this.rollback(txnId);
      throw error;
    }
  }

  /**
   * Get transaction info
   * @param {string} txnId - Transaction ID
   * @returns {object|null}
   */
  getTransactionInfo(txnId) {
    return this.transactions.get(txnId) || null;
  }

  /**
   * Get all active transactions
   * @returns {array}
   */
  getActiveTransactions() {
    return Array.from(this.transactions.values());
  }

  /**
   * Check if transaction is active
   * @param {string} txnId - Transaction ID
   * @returns {boolean}
   */
  isActive(txnId) {
    const txn = this.transactions.get(txnId);
    return txn && txn.status === 'active';
  }

  /**
   * Get transaction stats
   * @returns {object}
   */
  getStats() {
    const stats = {
      active: 0,
      committed: 0,
      rolledBack: 0,
    };

    for (const txn of this.transactions.values()) {
      if (txn.status === 'active') {
        stats.active++;
      }
    }

    return stats;
  }
}

export { DatabaseTransactionHelper };

export default DatabaseTransactionHelper;
