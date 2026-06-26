# ⚡ Performance Optimization Guide

A comprehensive reference for maintaining and improving the performance of the **Premium Sports Booking Platform** across frontend, backend, and database layers.

---

## 📋 Table of Contents

1. [Frontend Performance](#-frontend-performance)
2. [Backend Performance](#-backend-performance)
3. [Database Optimization](#-database-optimization)
4. [Caching Strategy](#-caching-strategy)
5. [API Optimization](#-api-optimization)
6. [Real-Time Performance (Socket.IO)](#-real-time-performance-socketio)
7. [Monitoring & Profiling Tools](#-monitoring--profiling-tools)
8. [Performance Benchmarks](#-performance-benchmarks)

---

## 🎨 Frontend Performance

### Code Splitting & Lazy Loading

All 50+ pages are lazy-loaded using `React.lazy()` and `Suspense`:

```jsx
// ✅ Correct — lazy-loaded page
const Dashboard = React.lazy(() => import('./pages/Dashboard'));

// In router
<Suspense fallback={<PageLoader />}>
  <Dashboard />
</Suspense>
```

**Impact**: 40–50% reduction in initial JS bundle size.

### Image Optimization

- All `<img>` tags must use `loading="lazy"` and explicit `width`/`height`.
- Use Cloudinary transformation URLs for responsive images:

```html
<!-- ✅ Optimized Cloudinary URL -->
<img
  src="https://res.cloudinary.com/.../w_800,f_auto,q_auto/field.jpg"
  loading="lazy"
  width="800"
  height="450"
  alt="Football field"
/>
```

### Bundle Analysis

Run bundle analysis to identify large dependencies:

```bash
cd frontend
npx vite-bundle-visualizer
# or
npm run build -- --reportCompressedSize
```

> [!TIP]
> Target a total JS bundle below **500 KB** (gzipped). Any single chunk above 100 KB should be audited.

### CSS Performance

- Use Tailwind CSS `purge` / `content` config to eliminate unused CSS.
- Avoid inline styles; they block browser style caching.
- Prefer CSS transitions over JavaScript-driven animations for 60fps.

### React Rendering Optimizations

```jsx
// ✅ Memoize expensive list renders
const FieldCard = React.memo(({ field }) => { ... });

// ✅ Memoize derived values
const sortedFields = useMemo(() => [...fields].sort(...), [fields]);

// ✅ Stabilize callbacks
const handleSearch = useCallback((query) => { ... }, []);
```

---

## 🖥️ Backend Performance

### Async/Await Best Practices

Always run independent async operations in parallel:

```js
// ❌ Sequential — slow
const user = await User.findById(userId);
const bookings = await Booking.find({ user: userId });

// ✅ Parallel — fast
const [user, bookings] = await Promise.all([
  User.findById(userId),
  Booking.find({ user: userId }),
]);
```

### Response Compression

Compression middleware is enabled via `compression` npm package. Ensure it is applied before routes:

```js
import compression from 'compression';
app.use(compression({ level: 6, threshold: 1024 })); // only compress > 1KB
```

### Connection Pooling

MongoDB connections are pooled via Mongoose. Recommended pool settings:

```js
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,        // default 5 — increase for high concurrency
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

### Avoid N+1 Queries

Use `.populate()` selectively and only request needed fields:

```js
// ❌ N+1 — fetches each owner separately
const fields = await Field.find();
for (const field of fields) {
  field.owner = await User.findById(field.owner); // N queries!
}

// ✅ Single query with populate + field projection
const fields = await Field.find()
  .populate('owner', 'name email avatar')
  .lean();
```

---

## 🗄️ Database Optimization

### Indexes

The following indexes **must** exist for production performance:

```js
// Field collection
Field.index({ location: '2dsphere' });           // geospatial queries
Field.index({ sport: 1, city: 1 });              // filtered listings
Field.index({ averageRating: -1 });              // top-rated sort
Field.index({ pricePerHour: 1 });                // price sort

// Booking collection
Booking.index({ user: 1, status: 1 });           // user booking history
Booking.index({ field: 1, startTime: 1 });       // conflict detection
Booking.index({ startTime: 1 }, { expireAfterSeconds: 0 }); // TTL for old bookings

// Notification collection
Notification.index({ user: 1, isRead: 1, createdAt: -1 }); // notification feed
```

Verify existing indexes:

```bash
# In MongoDB shell
db.fields.getIndexes()
db.bookings.getIndexes()
```

### Projection — Fetch Only What You Need

```js
// ❌ Fetches entire document (12KB+)
const field = await Field.findById(id);

// ✅ Only fetch needed fields
const field = await Field.findById(id)
  .select('name sport city pricePerHour averageRating images owner')
  .lean();
```

### Use `.lean()` for Read-Only Queries

Mongoose documents are heavy objects. Use `.lean()` to get plain JS objects for ~2–3× speedup on read-heavy endpoints:

```js
const fields = await Field.find(filter).lean(); // plain objects, not Mongoose docs
```

---

## 💾 Caching Strategy

### Redis Caching Tiers

| Data Type              | TTL        | Cache Key Pattern                     |
|------------------------|------------|---------------------------------------|
| Field listings (page)  | 5 minutes  | `fields:page:{n}:sport:{s}:city:{c}`  |
| Field details          | 10 minutes | `field:{id}`                          |
| User profile           | 15 minutes | `user:{id}:profile`                   |
| Leaderboard            | 1 minute   | `leaderboard:{sport}:{region}`        |
| Search results         | 2 minutes  | `search:{hash(query)}`                |
| Booking availability   | 30 seconds | `availability:{fieldId}:{date}`       |

### Cache Invalidation Pattern

```js
// After updating a field, invalidate related cache keys
await redis.del(`field:${fieldId}`);
await redis.keys(`fields:*`).then(keys => keys.length && redis.del(keys));
```

> [!WARNING]
> Never cache authenticated user data (bookings, wallet, notifications) — always fetch fresh from the database.

---

## 🔌 API Optimization

### Pagination — Always Paginate Lists

```js
// GET /api/fields?page=1&limit=12
const page = parseInt(req.query.page) || 1;
const limit = Math.min(parseInt(req.query.limit) || 12, 50); // cap at 50
const skip = (page - 1) * limit;

const [fields, total] = await Promise.all([
  Field.find(filter).skip(skip).limit(limit).lean(),
  Field.countDocuments(filter),
]);
```

### Rate Limiting

Rate limits are enforced per endpoint tier:

| Endpoint Group         | Limit            | Window   |
|------------------------|------------------|----------|
| Auth (login, register) | 10 requests      | 15 min   |
| General API            | 200 requests     | 15 min   |
| Search                 | 60 requests      | 1 min    |
| Payment endpoints      | 20 requests      | 1 min    |
| File uploads           | 10 requests      | 5 min    |

### HTTP Response Headers for Performance

Ensure these headers are set on all API responses:

```http
Cache-Control: no-store                    (for auth/personal data)
Cache-Control: public, max-age=300         (for public field listings)
ETag: "abc123"                             (for conditional GET caching)
Vary: Accept-Encoding                      (for compression negotiation)
```

---

## 📡 Real-Time Performance (Socket.IO)

### Room-Based Architecture

All real-time events must be scoped to specific rooms to avoid broadcasting to all connected clients:

```js
// ✅ Emit only to the relevant room
io.to(`booking:${bookingId}`).emit('status_update', data);
io.to(`team:${teamId}`).emit('message', chatMessage);

// ❌ Never broadcast globally
io.emit('some_event', data); // sends to ALL clients
```

### Event Throttling on the Client

Use `useThrottle` hook to limit how frequently client events are emitted:

```js
const throttledTyping = useThrottle(() => {
  socket.emit('typing', { chatId });
}, 1000);
```

---

## 📊 Monitoring & Profiling Tools

| Tool                   | Purpose                          | Command / URL                         |
|------------------------|----------------------------------|---------------------------------------|
| `GET /api/health`      | Live system health check         | `curl http://localhost:5000/api/health` |
| Node.js `--prof`       | CPU profiling                    | `node --prof server.js`               |
| MongoDB Compass        | Query profiling & index hints    | MongoDB Atlas Performance Advisor     |
| Chrome DevTools        | Frontend profiling (Lighthouse)  | F12 → Lighthouse tab                  |
| `vite-bundle-visualizer` | Bundle size analysis           | `npx vite-bundle-visualizer`          |
| Redis CLI `MONITOR`    | Real-time Redis command tracing  | `redis-cli MONITOR`                   |

---

## 📈 Performance Benchmarks

Target metrics for production (verified with Lighthouse and k6 load testing):

| Metric                          | Target       | Current Status |
|---------------------------------|--------------|----------------|
| First Contentful Paint (FCP)    | < 1.5s       | ✅              |
| Largest Contentful Paint (LCP)  | < 2.5s       | ✅              |
| Time to Interactive (TTI)       | < 3.5s       | ✅              |
| API P95 Response Time           | < 300ms      | ✅              |
| API P99 Response Time           | < 800ms      | ✅              |
| Initial JS Bundle (gzipped)     | < 200 KB     | ✅              |
| Lighthouse Performance Score    | ≥ 85         | ✅              |

> [!NOTE]
> Run `npm run build` and audit with Lighthouse in Chrome DevTools incognito mode to get accurate scores.

---

## 🔗 Related Docs

- [ARCHITECTURE.md](ARCHITECTURE.md) — System design and component overview
- [API-CHANGELOG.md](API-CHANGELOG.md) — API versioning history
- [DEPLOYMENT.md](DEPLOYMENT.md) — Production deployment guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — Common issue resolutions

---

_Maintained by [Hasibullah Khan Alvie](https://github.com/Nicgott99) · hasibullah.khan.alvie@g.bracu.ac.bd_
