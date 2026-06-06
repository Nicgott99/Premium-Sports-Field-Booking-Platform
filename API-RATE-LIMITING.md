# API Rate Limiting Documentation

## Overview

The Premium Sports Field Booking Platform API implements rate limiting to prevent abuse and ensure fair resource usage. Rate limits are applied per IP address or user (depending on endpoint).

## Rate Limit Tiers

### Tier 1: General Endpoints
- **Limit:** 100 requests per 15 minutes
- **Window:** 15 minutes (900,000 ms)
- **Applies to:** Most API endpoints
- **Reset:** Automatic every 15 minutes

### Tier 2: Authentication Endpoints
- **Limit:** 5 attempts per 15 minutes
- **Window:** 15 minutes
- **Applies to:** Login, registration, password reset
- **Reset:** Automatic every 15 minutes
- **Note:** Failed attempts count toward limit

### Tier 3: Payment Endpoints
- **Limit:** 10 requests per minute
- **Window:** 1 minute (60,000 ms)
- **Applies to:** Payment creation, confirmation, refunds
- **Reset:** Automatic every minute
- **Note:** Stricter limit due to financial transactions

### Tier 4: Health Checks
- **Limit:** Unlimited (bypasses rate limiting)
- **Endpoints:** `/api/health`, `/api/health/status`
- **Note:** Used for monitoring, excluded from limits

## Rate Limit Headers

All API responses include rate limit information in headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1615912345
X-RateLimit-Retry-After: 60
```

### Header Descriptions

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Maximum requests allowed | 100 |
| `X-RateLimit-Remaining` | Remaining requests in window | 45 |
| `X-RateLimit-Reset` | Unix timestamp when limit resets | 1615912345 |
| `X-RateLimit-Retry-After` | Seconds to wait before retry | 60 |

## Rate Limit Response

When rate limit is exceeded, the API returns:

### Status Code: 429 (Too Many Requests)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests from this IP, please try again later."
  },
  "retryAfter": 60
}
```

## Handling Rate Limits

### For Users

1. **Check remaining requests** - Use `X-RateLimit-Remaining` header
2. **Implement exponential backoff** - Wait longer between retries
3. **Batch requests** - Combine multiple calls when possible
4. **Cache responses** - Store responses locally when appropriate
5. **Monitor headers** - Track remaining quota

### Code Example (JavaScript)

```javascript
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    // Check rate limit headers
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const limit = response.headers.get('X-RateLimit-Limit');
    const reset = response.headers.get('X-RateLimit-Reset');
    
    console.log(`Rate limit: ${remaining}/${limit}, resets at ${new Date(reset * 1000)}`);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('X-RateLimit-Retry-After');
      const waitMs = parseInt(retryAfter) * 1000;
      console.log(`Rate limited, waiting ${waitMs}ms before retry`);
      
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, waitMs));
      return makeRequest(url, options);
    }
    
    return response.json();
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}
```

### Code Example (Axios)

```javascript
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Response interceptor to handle rate limiting
client.interceptors.response.use(
  response => {
    const remaining = response.headers['x-ratelimit-remaining'];
    const limit = response.headers['x-ratelimit-limit'];
    
    if (remaining) {
      console.log(`Requests remaining: ${remaining}/${limit}`);
    }
    
    return response;
  },
  error => {
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['x-ratelimit-retry-after']) * 1000;
      
      // Implement retry logic
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(client.request(error.config));
        }, retryAfter);
      });
    }
    
    return Promise.reject(error);
  }
);

export default client;
```

## Best Practices

### 1. Implement Caching
```javascript
// Cache user profile for 5 minutes
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

async function getUserProfile(userId) {
  const cacheKey = `user_${userId}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }
  
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();
  
  cache.set(cacheKey, { data, time: Date.now() });
  return data;
}
```

### 2. Batch Requests
```javascript
// Instead of multiple requests
for (let id of userIds) {
  await fetch(`/api/users/${id}`);
}

// Use batch endpoint if available
await fetch('/api/users/batch', {
  method: 'POST',
  body: JSON.stringify({ ids: userIds })
});
```

### 3. Implement Exponential Backoff
```javascript
async function fetchWithBackoff(url, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(url);
      
      if (response.status === 429) {
        const waitTime = Math.pow(2, retries) * 1000; // 1s, 2s, 4s
        console.log(`Waiting ${waitTime}ms before retry`);
        await new Promise(r => setTimeout(r, waitTime));
        retries++;
        continue;
      }
      
      return response;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

### 4. Monitor Usage
```javascript
// Track API usage
const apiMetrics = {
  requests: 0,
  rateLimited: 0,
  avgResponseTime: 0
};

// Use in your application
function trackApiCall(statusCode, duration) {
  apiMetrics.requests++;
  if (statusCode === 429) {
    apiMetrics.rateLimited++;
  }
  // Update average response time
}
```

## Exemptions and Special Cases

### Authenticated Users
- Slightly higher limits may be available for authenticated users
- Premium accounts may have increased rate limits
- Admin endpoints have different rate limit tiers

### Webhooks
- Webhook deliveries are not rate limited
- Webhook processing uses separate quotas

### Batch Operations
- Batch endpoints may have different rate limit calculations
- Each batch operation counted as single request

## Monitoring and Analytics

### API Rate Limit Metrics

Access rate limit analytics in admin dashboard:
- Total requests by endpoint
- Rate limit violations
- Peak usage times
- Abuse patterns

## Troubleshooting

### I'm getting 429 errors

1. **Check remaining quota** - Review `X-RateLimit-Remaining` header
2. **Implement backoff** - Wait before retrying
3. **Optimize requests** - Reduce number of API calls
4. **Use caching** - Store frequently accessed data locally
5. **Contact support** - If limit seems too restrictive

### Can I get higher limits?

- Contact: support@sports-platform.com
- Provide: Use case, expected volume
- Enterprise plans available for high-volume users

## Rate Limit Configuration

### Environment Variables

```env
# Rate limiting configuration
RATE_LIMIT_WINDOW_MS=900000        # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100        # Requests per window
AUTH_RATE_LIMIT_WINDOW_MS=900000   # 15 minutes
AUTH_RATE_LIMIT_MAX=5              # Auth attempts per window
PAYMENT_RATE_LIMIT_WINDOW_MS=60000 # 1 minute
PAYMENT_RATE_LIMIT_MAX=10          # Payment requests per window
```

## Support

For rate limiting issues or questions:

- **Documentation:** See this file
- **Issues:** GitHub Issues tracker
- **Support:** support@sports-platform.com
- **Status:** Check API status page

---

**Last Updated:** March 2024
**Version:** 1.0.0
