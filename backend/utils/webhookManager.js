import crypto from 'crypto';
import logger from './logger.js';

/**
 * Webhook management system for external integrations
 */

class WebhookManager {
  constructor() {
    this.webhooks = [];
    this.deliveryLog = [];
  }

  /**
   * Register webhook
   * @param {string} url - Webhook URL
   * @param {array} events - Events to listen
   * @param {string} secret - Webhook secret
   * @returns {object} Registered webhook
   */
  registerWebhook(url, events, secret = null) {
    const webhook = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      events: Array.isArray(events) ? events : [events],
      secret: secret || crypto.randomBytes(32).toString('hex'),
      active: true,
      createdAt: new Date(),
      lastDelivery: null,
      deliveryCount: 0,
      failureCount: 0,
    };

    this.webhooks.push(webhook);
    logger.info(`Webhook registered: ${url} for events: ${events.join(', ')}`);
    return webhook;
  }

  /**
   * Unregister webhook
   * @param {string} webhookId - Webhook ID
   * @returns {boolean} Success
   */
  unregisterWebhook(webhookId) {
    const index = this.webhooks.findIndex(w => w.id === webhookId);
    if (index !== -1) {
      this.webhooks.splice(index, 1);
      logger.info(`Webhook unregistered: ${webhookId}`);
      return true;
    }
    return false;
  }

  /**
   * Get webhook
   * @param {string} webhookId - Webhook ID
   * @returns {object} Webhook
   */
  getWebhook(webhookId) {
    return this.webhooks.find(w => w.id === webhookId);
  }

  /**
   * List all webhooks
   * @returns {array} Webhooks
   */
  listWebhooks() {
    return this.webhooks;
  }

  /**
   * Trigger webhook event
   * @param {string} event - Event name
   * @param {object} data - Event data
   * @returns {Promise} Delivery results
   */
  async triggerEvent(event, data) {
    const targetWebhooks = this.webhooks.filter(w =>
      w.active && w.events.includes(event)
    );

    const deliveries = await Promise.all(
      targetWebhooks.map(webhook => this.deliverWebhook(webhook, event, data))
    );

    return deliveries;
  }

  /**
   * Deliver webhook payload
   * @param {object} webhook - Webhook
   * @param {string} event - Event name
   * @param {object} data - Event data
   * @returns {Promise} Delivery result
   */
  async deliverWebhook(webhook, event, data) {
    const payload = {
      id: crypto.randomBytes(16).toString('hex'),
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const signature = this.createSignature(payload, webhook.secret);
    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-ID': webhook.id,
    };

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        timeout: 30000,
      });

      const success = response.ok;
      webhook.lastDelivery = new Date();
      webhook.deliveryCount++;

      if (!success) {
        webhook.failureCount++;
        logger.warn(`Webhook delivery failed: ${webhook.url} (${response.status})`);
      }

      this.logDelivery(webhook.id, event, success);
      return { webhookId: webhook.id, success, statusCode: response.status };
    } catch (error) {
      webhook.failureCount++;
      logger.error(`Webhook delivery error: ${webhook.url} - ${error.message}`);
      this.logDelivery(webhook.id, event, false, error.message);
      return { webhookId: webhook.id, success: false, error: error.message };
    }
  }

  /**
   * Create webhook signature
   * @param {object} payload - Payload
   * @param {string} secret - Webhook secret
   * @returns {string} Signature
   */
  createSignature(payload, secret) {
    const data = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify webhook signature
   * @param {object} payload - Payload
   * @param {string} signature - Signature to verify
   * @param {string} secret - Webhook secret
   * @returns {boolean} Valid
   */
  verifySignature(payload, signature, secret) {
    const expected = this.createSignature(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  /**
   * Log delivery attempt
   * @param {string} webhookId - Webhook ID
   * @param {string} event - Event name
   * @param {boolean} success - Success status
   * @param {string} error - Error message
   */
  logDelivery(webhookId, event, success, error = null) {
    this.deliveryLog.push({
      webhookId,
      event,
      success,
      error,
      timestamp: new Date(),
    });

    // Keep only last 1000 logs
    if (this.deliveryLog.length > 1000) {
      this.deliveryLog.shift();
    }
  }

  /**
   * Get delivery history
   * @param {string} webhookId - Webhook ID
   * @param {number} limit - Number of logs
   * @returns {array} Delivery logs
   */
  getDeliveryHistory(webhookId, limit = 50) {
    return this.deliveryLog
      .filter(log => log.webhookId === webhookId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Disable webhook on repeated failures
   * @param {number} maxFailures - Max consecutive failures
   */
  disableFailedWebhooks(maxFailures = 5) {
    this.webhooks.forEach(webhook => {
      if (webhook.failureCount >= maxFailures) {
        webhook.active = false;
        logger.warn(`Webhook disabled due to failures: ${webhook.id}`);
      }
    });
  }

  /**
   * Retry failed deliveries
   * @returns {Promise} Retry results
   */
  async retryFailedDeliveries() {
    const failedLogs = this.deliveryLog.filter(log => !log.success).slice(-10);
    const results = [];

    for (const log of failedLogs) {
      const webhook = this.getWebhook(log.webhookId);
      if (webhook && webhook.active) {
        const result = await this.deliverWebhook(webhook, log.event, {});
        results.push(result);
      }
    }

    return results;
  }
}

export const webhookManager = new WebhookManager();

export default webhookManager;
