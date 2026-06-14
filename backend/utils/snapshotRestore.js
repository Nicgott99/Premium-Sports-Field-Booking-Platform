/**
 * Snapshot and restore utility for data backup and recovery
 */

class SnapshotRestore {
  constructor(options = {}) {
    this.snapshots = new Map();
    this.maxSnapshots = options.maxSnapshots || 10;
    this.autoCleanup = options.autoCleanup || true;
  }

  /**
   * Create snapshot
   * @param {string} name - Snapshot name
   * @param {*} data - Data to snapshot
   * @param {object} metadata - Metadata
   * @returns {string} Snapshot ID
   */
  createSnapshot(name, data, metadata = {}) {
    const snapshotId = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const snapshot = {
      id: snapshotId,
      name,
      timestamp: Date.now(),
      data: this.deepClone(data),
      metadata,
      size: this.calculateSize(data),
    };

    this.snapshots.set(snapshotId, snapshot);

    if (this.autoCleanup && this.snapshots.size > this.maxSnapshots) {
      this.removeOldest();
    }

    return snapshotId;
  }

  /**
   * Restore snapshot
   * @param {string} snapshotId - Snapshot ID
   * @returns {*} Restored data
   */
  restore(snapshotId) {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    return this.deepClone(snapshot.data);
  }

  /**
   * Get snapshot info
   * @param {string} snapshotId - Snapshot ID
   * @returns {object|null}
   */
  getSnapshotInfo(snapshotId) {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      return null;
    }

    return {
      id: snapshot.id,
      name: snapshot.name,
      timestamp: new Date(snapshot.timestamp).toISOString(),
      size: snapshot.size,
      metadata: snapshot.metadata,
    };
  }

  /**
   * List all snapshots
   * @returns {array}
   */
  listSnapshots() {
    return Array.from(this.snapshots.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(s => ({
        id: s.id,
        name: s.name,
        timestamp: new Date(s.timestamp).toISOString(),
        size: s.size,
      }));
  }

  /**
   * Delete snapshot
   * @param {string} snapshotId - Snapshot ID
   * @returns {boolean}
   */
  deleteSnapshot(snapshotId) {
    return this.snapshots.delete(snapshotId);
  }

  /**
   * Compare snapshots
   * @param {string} id1 - First snapshot ID
   * @param {string} id2 - Second snapshot ID
   * @returns {object}
   */
  compareSnapshots(id1, id2) {
    const snapshot1 = this.snapshots.get(id1);
    const snapshot2 = this.snapshots.get(id2);

    if (!snapshot1 || !snapshot2) {
      throw new Error('One or both snapshots not found');
    }

    return {
      differences: this.findDifferences(snapshot1.data, snapshot2.data),
      snapshot1: { id: id1, timestamp: new Date(snapshot1.timestamp) },
      snapshot2: { id: id2, timestamp: new Date(snapshot2.timestamp) },
    };
  }

  /**
   * Find differences between two objects
   * @param {*} obj1 - First object
   * @param {*} obj2 - Second object
   * @returns {object}
   */
  findDifferences(obj1, obj2, path = '') {
    const differences = {
      added: [],
      removed: [],
      modified: [],
    };

    if (typeof obj1 !== typeof obj2) {
      differences.modified.push(path);
      return differences;
    }

    if (typeof obj1 !== 'object' || obj1 === null) {
      if (obj1 !== obj2) {
        differences.modified.push(path);
      }
      return differences;
    }

    // Check for added and modified properties
    for (const key in obj2) {
      const newPath = path ? `${path}.${key}` : key;
      if (!(key in obj1)) {
        differences.added.push(newPath);
      } else {
        const nestedDiff = this.findDifferences(obj1[key], obj2[key], newPath);
        differences.added.push(...nestedDiff.added);
        differences.removed.push(...nestedDiff.removed);
        differences.modified.push(...nestedDiff.modified);
      }
    }

    // Check for removed properties
    for (const key in obj1) {
      const newPath = path ? `${path}.${key}` : key;
      if (!(key in obj2)) {
        differences.removed.push(newPath);
      }
    }

    return differences;
  }

  /**
   * Deep clone object
   * @param {*} obj - Object to clone
   * @returns {*}
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item));
    }

    const cloned = {};
    for (const key in obj) {
      cloned[key] = this.deepClone(obj[key]);
    }
    return cloned;
  }

  /**
   * Calculate size of object
   * @param {*} obj - Object
   * @returns {number}
   */
  calculateSize(obj) {
    return JSON.stringify(obj).length;
  }

  /**
   * Remove oldest snapshot
   */
  removeOldest() {
    let oldest = null;
    let oldestId = null;

    for (const [id, snapshot] of this.snapshots) {
      if (!oldest || snapshot.timestamp < oldest.timestamp) {
        oldest = snapshot;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.snapshots.delete(oldestId);
    }
  }

  /**
   * Get total snapshots size
   * @returns {number}
   */
  getTotalSize() {
    return Array.from(this.snapshots.values()).reduce((sum, s) => sum + s.size, 0);
  }

  /**
   * Get statistics
   * @returns {object}
   */
  getStats() {
    const snapshots = Array.from(this.snapshots.values());

    return {
      count: snapshots.length,
      totalSize: this.getTotalSize(),
      oldest: snapshots.length > 0 ? new Date(Math.min(...snapshots.map(s => s.timestamp))) : null,
      newest: snapshots.length > 0 ? new Date(Math.max(...snapshots.map(s => s.timestamp))) : null,
    };
  }

  /**
   * Clear all snapshots
   */
  clear() {
    this.snapshots.clear();
  }
}

export { SnapshotRestore };

export const snapshotRestore = new SnapshotRestore();

export default SnapshotRestore;
