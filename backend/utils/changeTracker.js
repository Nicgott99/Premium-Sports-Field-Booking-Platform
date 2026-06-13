/**
 * Change tracking for data modifications
 */

class ChangeTracker {
  /**
   * Track changes between old and new values
   * @param {object} oldData - Original data
   * @param {object} newData - Modified data
   * @returns {object} Changes
   */
  static trackChanges(oldData, newData) {
    const changes = {
      added: {},
      updated: {},
      removed: {},
      unchanged: {},
    };

    // Check for updates and unchanged
    for (const [key, newValue] of Object.entries(newData)) {
      if (!(key in oldData)) {
        changes.added[key] = newValue;
      } else if (JSON.stringify(oldData[key]) !== JSON.stringify(newValue)) {
        changes.updated[key] = { old: oldData[key], new: newValue };
      } else {
        changes.unchanged[key] = newValue;
      }
    }

    // Check for removed
    for (const [key, oldValue] of Object.entries(oldData)) {
      if (!(key in newData)) {
        changes.removed[key] = oldValue;
      }
    }

    return changes;
  }

  /**
   * Check if changes exist
   * @param {object} changes - Changes object
   * @returns {boolean}
   */
  static hasChanges(changes) {
    return (
      Object.keys(changes.added).length > 0 ||
      Object.keys(changes.updated).length > 0 ||
      Object.keys(changes.removed).length > 0
    );
  }

  /**
   * Get changed fields
   * @param {object} changes - Changes object
   * @returns {array} Field names
   */
  static getChangedFields(changes) {
    return [
      ...Object.keys(changes.added),
      ...Object.keys(changes.updated),
      ...Object.keys(changes.removed),
    ];
  }

  /**
   * Create audit entry
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {string} action - Action (create, update, delete)
   * @param {object} changes - Changes
   * @param {string} userId - User ID
   * @returns {object} Audit entry
   */
  static createAuditEntry(entityType, entityId, action, changes, userId) {
    return {
      timestamp: new Date().toISOString(),
      entityType,
      entityId,
      action,
      changes,
      userId,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  /**
   * Format changes for display
   * @param {object} changes - Changes
   * @returns {string} Formatted changes
   */
  static format(changes) {
    const lines = [];

    if (Object.keys(changes.added).length > 0) {
      lines.push('Added: ' + Object.keys(changes.added).join(', '));
    }

    if (Object.keys(changes.updated).length > 0) {
      const updates = Object.entries(changes.updated)
        .map(([key, { old, new: newVal }]) => `${key}: ${old} → ${newVal}`)
        .join(', ');
      lines.push('Updated: ' + updates);
    }

    if (Object.keys(changes.removed).length > 0) {
      lines.push('Removed: ' + Object.keys(changes.removed).join(', '));
    }

    return lines.join('\n');
  }
}

export { ChangeTracker };

export default ChangeTracker;
