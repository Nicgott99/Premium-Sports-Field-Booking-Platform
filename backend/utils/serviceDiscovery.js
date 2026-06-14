/**
 * Service discovery utility for locating and managing service instances
 */

class ServiceDiscovery {
  constructor(options = {}) {
    this.services = new Map();
    this.healthChecks = new Map();
    this.heartbeatInterval = options.heartbeatInterval || 10000;
    this.healthCheckInterval = options.healthCheckInterval || 5000;
  }

  /**
   * Register service instance
   * @param {string} serviceName - Service name
   * @param {string} instanceId - Instance ID
   * @param {object} metadata - Instance metadata
   */
  register(serviceName, instanceId, metadata = {}) {
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, new Map());
    }

    this.services.get(serviceName).set(instanceId, {
      id: instanceId,
      name: serviceName,
      metadata,
      registeredAt: Date.now(),
      lastHeartbeat: Date.now(),
      healthy: true,
      weight: metadata.weight || 1,
    });
  }

  /**
   * Deregister service instance
   * @param {string} serviceName - Service name
   * @param {string} instanceId - Instance ID
   */
  deregister(serviceName, instanceId) {
    const instances = this.services.get(serviceName);
    if (instances) {
      instances.delete(instanceId);
    }
  }

  /**
   * Discover service instances
   * @param {string} serviceName - Service name
   * @returns {array}
   */
  discover(serviceName) {
    const instances = this.services.get(serviceName);
    if (!instances) {
      return [];
    }

    return Array.from(instances.values()).filter(i => i.healthy);
  }

  /**
   * Get instance by ID
   * @param {string} serviceName - Service name
   * @param {string} instanceId - Instance ID
   * @returns {object|null}
   */
  getInstance(serviceName, instanceId) {
    const instances = this.services.get(serviceName);
    return instances?.get(instanceId) || null;
  }

  /**
   * Load balance across instances
   * @param {string} serviceName - Service name
   * @returns {object|null}
   */
  getLoadBalanced(serviceName) {
    const instances = this.discover(serviceName);
    if (instances.length === 0) {
      return null;
    }

    // Weighted round-robin
    const totalWeight = instances.reduce((sum, i) => sum + i.weight, 0);
    let pick = Math.random() * totalWeight;

    for (const instance of instances) {
      pick -= instance.weight;
      if (pick <= 0) {
        return instance;
      }
    }

    return instances[0];
  }

  /**
   * Record heartbeat
   * @param {string} serviceName - Service name
   * @param {string} instanceId - Instance ID
   */
  heartbeat(serviceName, instanceId) {
    const instance = this.getInstance(serviceName, instanceId);
    if (instance) {
      instance.lastHeartbeat = Date.now();
    }
  }

  /**
   * Mark instance as unhealthy
   * @param {string} serviceName - Service name
   * @param {string} instanceId - Instance ID
   * @param {string} reason - Reason for unhealthy status
   */
  markUnhealthy(serviceName, instanceId, reason = 'unknown') {
    const instance = this.getInstance(serviceName, instanceId);
    if (instance) {
      instance.healthy = false;
      instance.unhealthyReason = reason;
    }
  }

  /**
   * Mark instance as healthy
   * @param {string} serviceName - Service name
   * @param {string} instanceId - Instance ID
   */
  markHealthy(serviceName, instanceId) {
    const instance = this.getInstance(serviceName, instanceId);
    if (instance) {
      instance.healthy = true;
      instance.unhealthyReason = null;
    }
  }

  /**
   * Register health check
   * @param {string} serviceName - Service name
   * @param {function} checker - Health check function
   */
  registerHealthCheck(serviceName, checker) {
    this.healthChecks.set(serviceName, checker);
  }

  /**
   * Run health checks
   */
  async runHealthChecks() {
    for (const [serviceName, checker] of this.healthChecks) {
      const instances = this.discover(serviceName);

      for (const instance of instances) {
        try {
          const isHealthy = await checker(instance);
          if (isHealthy) {
            this.markHealthy(serviceName, instance.id);
          } else {
            this.markUnhealthy(serviceName, instance.id, 'health check failed');
          }
        } catch (error) {
          this.markUnhealthy(serviceName, instance.id, error.message);
        }
      }
    }
  }

  /**
   * Cleanup stale instances
   * @param {number} timeout - Timeout in milliseconds
   */
  cleanup(timeout = 30000) {
    const now = Date.now();
    let cleaned = 0;

    for (const [serviceName, instances] of this.services) {
      for (const [instanceId, instance] of instances) {
        if (now - instance.lastHeartbeat > timeout) {
          instances.delete(instanceId);
          cleaned++;
        }
      }
    }

    return cleaned;
  }

  /**
   * Get all services
   * @returns {array}
   */
  getAllServices() {
    const services = [];

    for (const [name, instances] of this.services) {
      services.push({
        name,
        instances: Array.from(instances.values()),
        healthy: Array.from(instances.values()).filter(i => i.healthy).length,
        total: instances.size,
      });
    }

    return services;
  }

  /**
   * Clear all registrations
   */
  clear() {
    this.services.clear();
  }
}

export { ServiceDiscovery };

export const serviceDiscovery = new ServiceDiscovery();

export default ServiceDiscovery;
