import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import logger from './logger.js';

const BACKUP_DIR = 'backups';

export const createBackupDir = async () => {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (err) {
    logger.error(`Failed to create backup directory: ${err.message}`);
  }
};

export const backupDatabase = async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const backup = {};

    for (const collection of collections) {
      const name = collection.name;
      const data = await mongoose.connection.collection(name).find({}).toArray();
      backup[name] = data;
    }

    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    await fs.writeFile(filepath, JSON.stringify(backup, null, 2));
    logger.info(`Database backup created: ${filename}`);
    return filepath;
  } catch (err) {
    logger.error(`Database backup failed: ${err.message}`);
    throw err;
  }
};

export const listBackups = async () => {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    return files.filter(f => f.startsWith('backup-')).sort().reverse();
  } catch (err) {
    logger.warn(`Failed to list backups: ${err.message}`);
    return [];
  }
};

export const getBackupSize = async (filename) => {
  try {
    const filepath = path.join(BACKUP_DIR, filename);
    const stats = await fs.stat(filepath);
    return (stats.size / 1024 / 1024).toFixed(2);
  } catch (err) {
    return 0;
  }
};

export const deleteOldBackups = async (keepCount = 10) => {
  try {
    const backups = await listBackups();
    const toDelete = backups.slice(keepCount);

    for (const filename of toDelete) {
      const filepath = path.join(BACKUP_DIR, filename);
      await fs.unlink(filepath);
      logger.info(`Deleted old backup: ${filename}`);
    }
  } catch (err) {
    logger.error(`Failed to delete old backups: ${err.message}`);
  }
};

export const scheduleBackups = (intervalMinutes = 1440) => {
  setInterval(async () => {
    await backupDatabase();
    await deleteOldBackups(10);
  }, intervalMinutes * 60 * 1000);
  logger.info(`Database backup scheduler started (every ${intervalMinutes} minutes)`);
};
