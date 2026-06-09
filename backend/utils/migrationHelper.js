import fs from 'fs';
import path from 'path';
import logger from './logger.js';

/**
 * Database migration helper utilities
 */

class MigrationHelper {
  constructor() {
    this.migrationsDir = './migrations';
    this.migrationHistory = [];
  }

  /**
   * Create migration file
   * @param {string} name - Migration name
   * @returns {string} File path
   */
  createMigration(name) {
    const timestamp = Date.now();
    const filename = `${timestamp}_${name}.js`;
    const filepath = path.join(this.migrationsDir, filename);

    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true });
    }

    const template = `
/**
 * Migration: ${name}
 * Date: ${new Date().toISOString()}
 */

export const up = async (db) => {
  // Write your migration up logic here
  logger.info('Running migration: ${name} - up');
};

export const down = async (db) => {
  // Write your migration down logic here
  logger.info('Running migration: ${name} - down');
};

export const name = '${name}';
`;

    fs.writeFileSync(filepath, template);
    logger.info(`Migration created: ${filename}`);
    return filepath;
  }

  /**
   * List available migrations
   * @returns {array} Migration files
   */
  listMigrations() {
    if (!fs.existsSync(this.migrationsDir)) {
      return [];
    }

    return fs.readdirSync(this.migrationsDir)
      .filter(f => f.endsWith('.js'))
      .map(f => ({
        filename: f,
        timestamp: parseInt(f.split('_')[0]),
        name: f.slice(f.indexOf('_') + 1, -3),
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Run pending migrations
   * @param {object} db - Database connection
   * @returns {Promise} Migration results
   */
  async runPendingMigrations(db) {
    const migrations = this.listMigrations();
    const results = [];

    for (const migration of migrations) {
      const isRun = await this.isMigrationRun(migration.filename);
      if (!isRun) {
        try {
          const mod = await import(path.join(this.migrationsDir, migration.filename));
          await mod.up(db);
          await this.recordMigration(migration.filename, 'up');
          results.push({ migration: migration.name, status: 'success' });
          logger.info(`Migration completed: ${migration.name}`);
        } catch (error) {
          results.push({ migration: migration.name, status: 'failed', error: error.message });
          logger.error(`Migration failed: ${migration.name}`, error);
        }
      }
    }

    return results;
  }

  /**
   * Rollback last migration
   * @param {object} db - Database connection
   * @returns {Promise} Rollback result
   */
  async rollbackLastMigration(db) {
    const lastMigration = await this.getLastRanMigration();
    if (!lastMigration) {
      logger.warn('No migrations to rollback');
      return null;
    }

    try {
      const mod = await import(path.join(this.migrationsDir, lastMigration.filename));
      await mod.down(db);
      await this.recordMigration(lastMigration.filename, 'down');
      logger.info(`Rollback completed: ${lastMigration.filename}`);
      return { filename: lastMigration.filename, status: 'success' };
    } catch (error) {
      logger.error(`Rollback failed: ${lastMigration.filename}`, error);
      return { filename: lastMigration.filename, status: 'failed', error: error.message };
    }
  }

  /**
   * Check if migration has been run
   * @param {string} filename - Migration filename
   * @returns {Promise} Is run
   */
  async isMigrationRun(filename) {
    // This should query the database for migration history
    // For now, return false to always run migrations
    return false;
  }

  /**
   * Record migration in database
   * @param {string} filename - Migration filename
   * @param {string} direction - up or down
   * @returns {Promise}
   */
  async recordMigration(filename, direction = 'up') {
    this.migrationHistory.push({
      filename,
      direction,
      ranAt: new Date(),
    });
  }

  /**
   * Get last ran migration
   * @returns {Promise} Last migration
   */
  async getLastRanMigration() {
    if (this.migrationHistory.length === 0) {
      return null;
    }
    return this.migrationHistory[this.migrationHistory.length - 1];
  }

  /**
   * Get migration status
   * @returns {object} Migration status
   */
  getMigrationStatus() {
    const all = this.listMigrations();
    const ran = this.migrationHistory.filter(m => m.direction === 'up');

    return {
      total: all.length,
      completed: ran.length,
      pending: all.length - ran.length,
      migrations: all.map(m => ({
        ...m,
        status: ran.some(r => r.filename === m.filename) ? 'completed' : 'pending',
      })),
    };
  }

  /**
   * Validate migration files
   * @returns {array} Validation errors
   */
  validateMigrations() {
    const migrations = this.listMigrations();
    const errors = [];

    migrations.forEach(m => {
      if (!m.name || m.name.length === 0) {
        errors.push(`Invalid migration name: ${m.filename}`);
      }

      const filepath = path.join(this.migrationsDir, m.filename);
      const content = fs.readFileSync(filepath, 'utf-8');

      if (!content.includes('export const up')) {
        errors.push(`Missing 'up' function in ${m.filename}`);
      }

      if (!content.includes('export const down')) {
        errors.push(`Missing 'down' function in ${m.filename}`);
      }
    });

    return errors;
  }

  /**
   * Reset all migrations
   * @param {object} db - Database connection
   * @returns {Promise}
   */
  async resetAllMigrations(db) {
    const migrations = this.migrationHistory.filter(m => m.direction === 'up').reverse();

    for (const migration of migrations) {
      const mod = await import(path.join(this.migrationsDir, migration.filename));
      await mod.down(db);
      this.migrationHistory = this.migrationHistory.filter(m => m.filename !== migration.filename);
    }

    logger.warn('All migrations reset');
  }
}

export const migrationHelper = new MigrationHelper();

export default migrationHelper;
