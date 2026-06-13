import logger from './logger.js';

/**
 * Data seeding utility for populating test and development data
 */

class DataSeeder {
  constructor() {
    this.seeders = new Map();
    this.executed = new Set();
  }

  /**
   * Register seeder
   * @param {string} name - Seeder name
   * @param {function} fn - Seeder function
   * @param {array} dependencies - Dependent seeders
   */
  register(name, fn, dependencies = []) {
    this.seeders.set(name, { fn, dependencies });
  }

  /**
   * Run seeder
   * @param {string} name - Seeder name
   * @returns {Promise}
   */
  async run(name) {
    if (this.executed.has(name)) return;

    const seeder = this.seeders.get(name);
    if (!seeder) {
      throw new Error(`Seeder not found: ${name}`);
    }

    // Run dependencies first
    for (const dep of seeder.dependencies) {
      await this.run(dep);
    }

    logger.info(`Running seeder: ${name}`);
    await seeder.fn();
    this.executed.add(name);
  }

  /**
   * Run all seeders
   * @returns {Promise}
   */
  async runAll() {
    for (const [name] of this.seeders) {
      await this.run(name);
    }
  }

  /**
   * Reset seeded data
   * @returns {Promise}
   */
  async reset() {
    this.executed.clear();
  }

  /**
   * Get execution status
   * @returns {object} Status
   */
  getStatus() {
    return {
      registered: this.seeders.size,
      executed: this.executed.size,
      pending: this.seeders.size - this.executed.size,
    };
  }
}

/**
 * Factory seeder for generating fake data
 */
class FactorySeeder {
  /**
   * Create multiple records
   * @param {number} count - Number of records
   * @param {function} factory - Factory function
   * @returns {array} Created records
   */
  static createMany(count, factory) {
    return Array.from({ length: count }, (_, i) => factory(i));
  }

  /**
   * Create batch
   * @param {number} count - Number of records
   * @param {function} factory - Factory function
   * @param {function} save - Save function
   * @returns {Promise}
   */
  static async saveBatch(count, factory, save) {
    const records = this.createMany(count, factory);
    return Promise.all(records.map(save));
  }
}

export { DataSeeder, FactorySeeder };

export const dataSeeder = new DataSeeder();

export default DataSeeder;
