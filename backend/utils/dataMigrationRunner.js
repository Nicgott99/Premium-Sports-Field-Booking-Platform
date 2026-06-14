/**
 * Data migration runner for managing database migrations
 */

class DataMigrationRunner {
  constructor(options = {}) {
    this.migrations = new Map();
    this.executedMigrations = new Set();
    this.rollbackStack = [];
    this.verbose = options.verbose || false;
  }

  /**
   * Register migration
   * @param {string} name - Migration name
   * @param {object} migration - Migration object
   */
  registerMigration(name, migration) {
    if (this.migrations.has(name)) {
      throw new Error(`Migration already registered: ${name}`);
    }

    this.migrations.set(name, {
      name,
      version: migration.version || 1,
      description: migration.description || '',
      up: migration.up,
      down: migration.down,
      timestamp: migration.timestamp || Date.now(),
    });
  }

  /**
   * Run migration
   * @param {string} name - Migration name
   * @returns {Promise}
   */
  async runMigration(name) {
    if (this.executedMigrations.has(name)) {
      this.log(`Migration already executed: ${name}`);
      return;
    }

    const migration = this.migrations.get(name);
    if (!migration) {
      throw new Error(`Migration not found: ${name}`);
    }

    try {
      this.log(`Running migration: ${name}`);
      await migration.up();
      this.executedMigrations.add(name);
      this.rollbackStack.push(name);
      this.log(`Migration completed: ${name}`);
    } catch (error) {
      this.log(`Migration failed: ${name}`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   * @returns {Promise}
   */
  async runAllMigrations() {
    const migrations = Array.from(this.migrations.values()).sort((a, b) => a.timestamp - b.timestamp);

    for (const migration of migrations) {
      if (!this.executedMigrations.has(migration.name)) {
        await this.runMigration(migration.name);
      }
    }
  }

  /**
   * Rollback migration
   * @param {string} name - Migration name
   * @returns {Promise}
   */
  async rollbackMigration(name) {
    if (!this.executedMigrations.has(name)) {
      throw new Error(`Migration not executed: ${name}`);
    }

    const migration = this.migrations.get(name);
    if (!migration || !migration.down) {
      throw new Error(`Migration has no rollback: ${name}`);
    }

    try {
      this.log(`Rolling back migration: ${name}`);
      await migration.down();
      this.executedMigrations.delete(name);
      const index = this.rollbackStack.indexOf(name);
      if (index > -1) {
        this.rollbackStack.splice(index, 1);
      }
      this.log(`Migration rolled back: ${name}`);
    } catch (error) {
      this.log(`Rollback failed: ${name}`, error);
      throw error;
    }
  }

  /**
   * Rollback last N migrations
   * @param {number} count - Number of migrations to rollback
   * @returns {Promise}
   */
  async rollbackLast(count = 1) {
    for (let i = 0; i < count && this.rollbackStack.length > 0; i++) {
      const name = this.rollbackStack[this.rollbackStack.length - 1];
      await this.rollbackMigration(name);
    }
  }

  /**
   * Get migration status
   * @returns {object}
   */
  getStatus() {
    const migrations = Array.from(this.migrations.values()).sort((a, b) => a.timestamp - b.timestamp);

    const status = {
      total: migrations.length,
      executed: this.executedMigrations.size,
      pending: migrations.length - this.executedMigrations.size,
      migrations: migrations.map(m => ({
        name: m.name,
        description: m.description,
        executed: this.executedMigrations.has(m.name),
        timestamp: new Date(m.timestamp).toISOString(),
      })),
    };

    return status;
  }

  /**
   * Get executed migrations
   * @returns {array}
   */
  getExecuted() {
    return Array.from(this.executedMigrations);
  }

  /**
   * Get pending migrations
   * @returns {array}
   */
  getPending() {
    const executed = this.executedMigrations;
    return Array.from(this.migrations.keys()).filter(name => !executed.has(name));
  }

  /**
   * Clear executed migrations
   */
  clearExecuted() {
    this.executedMigrations.clear();
    this.rollbackStack = [];
  }

  /**
   * Log message
   * @param {string} message - Message
   * @param {error} error - Error (optional)
   */
  log(message, error = null) {
    if (this.verbose) {
      console.log(`[Migration] ${message}`);
      if (error) {
        console.error(error);
      }
    }
  }

  /**
   * Validate migrations
   * @returns {object}
   */
  validate() {
    const warnings = [];
    const migrations = Array.from(this.migrations.values());

    for (let i = 0; i < migrations.length; i++) {
      const current = migrations[i];
      if (!current.up) {
        warnings.push(`Migration ${current.name} has no up function`);
      }
    }

    return { valid: warnings.length === 0, warnings };
  }
}

export { DataMigrationRunner };

export default DataMigrationRunner;
