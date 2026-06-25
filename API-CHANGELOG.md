# API Changelog

This document tracks all API changes by version for the **Premium Sports Booking Platform** backend.  
All breaking changes are clearly marked. Follow [Semantic Versioning](https://semver.org/).

---

## [v1.1.0] – 2026-06-25

### ✨ Added
- **`GET /api/health`** — New comprehensive health check endpoint.  
  Returns system status, MongoDB connectivity, memory usage, CPU load, and process uptime.  
  Responds `200 OK` when healthy, `503 Service Unavailable` when degraded.

- **Notification Service** — `backend/services/notificationService.js`  
  Centralized service for creating, reading, and managing in-app notifications.  
  - `createNotification({ userId, type, title, message, data })`
  - `markAsRead(notificationId, userId)`
  - `markAllAsRead(userId)`
  - `getUnreadCount(userId)`
  - `getUserNotifications(userId, page, limit)` — paginated
  - `sendBookingNotification(userId, status, booking)` — typed booking events

- **Health Monitor Utility** — `backend/utils/healthMonitor.js`  
  Standalone module for programmatic health checks and Express middleware integration.

---

## [v1.0.5] – 2026-06-24

### 🔧 Changed
- **`.gitignore`** — Updated to exclude AI assistant artifacts, batch scripts, and agent logs.
- **`CODEOWNERS`** — Added `.github/CODEOWNERS` assigning `@Nicgott99` as global code owner.
- **Docker** — Added `.dockerignore` files for both `backend/` and `frontend/` directories to reduce image sizes.

---

## [v1.0.4] – 2026-06-20

### ✨ Added
- **Custom React Hooks** (20+ hooks in `frontend/src/hooks/`):
  - `useWindowResize`, `useToggle`, `useTimeout`, `useThrottle`
  - `useScrollPosition`, `usePrevious`, `useMediaQuery`, `useMeasure`
  - `useInterval`, `useIdle`, `useGeolocation`, `useField`, and more

### 🔧 Changed
- **Frontend Design System** — Introduced Kinetic Elite Design System with amber gold (`#FBBF24`) accents.
- **Code Splitting** — All 50+ pages now lazy-loaded via `React.lazy()` + `Suspense`.

---

## [v1.0.3] – 2026-06-15

### ✨ Added
- **`POST /api/payments/create-intent`** — Stripe payment intent creation.
- **`POST /api/payments/confirm`** — Payment confirmation and booking status update.
- **`GET /api/payments/history`** — Paginated user payment history.
- **`POST /api/payments/refund`** — Initiate refund for a cancelled booking.
- **`GET /api/payments/:id/invoice`** — Download PDF invoice for a payment.

### ✨ Added Services
- `backend/services/pricingService.js` — Dynamic pricing with demand multipliers, peak rates, sport modifiers.
- `backend/services/loyaltyService.js` — Loyalty points tracking and reward redemption.
- `backend/services/reportService.js` — Revenue, retention, and field occupancy analytics.
- `backend/services/smsService.js` — Twilio SMS notifications for booking events.
- `backend/services/emailService.js` — Nodemailer HTML email templates.
- `backend/services/weatherService.js` — OpenWeatherMap integration for field playability.

---

## [v1.0.2] – 2026-06-10

### ✨ Added
- **Tournament API** — Full bracket generation, team registration, and live score updates.
  - `POST /api/tournaments` — Create tournament
  - `GET /api/tournaments/:id/bracket` — Get bracket
  - `PUT /api/tournaments/:id/scores` — Update scores (Owner/Admin)

- **Team API**:
  - `POST /api/teams` — Create team
  - `PUT /api/teams/:id/members` — Add/remove members
  - `GET /api/teams/:id/schedule` — Get team schedule

- **`GET /api/fields/nearby`** — Geolocation-based nearby field discovery using MongoDB `$near`.

### 🔧 Changed
- All booking endpoints now require `Authorization: Bearer <token>` header.
- `GET /api/fields` now supports sorting: `sort=rating`, `sort=price`, `sort=distance`.

---

## [v1.0.1] – 2026-06-05

### ✨ Added
- **`POST /api/auth/firebase-login`** — Firebase ID token exchange for platform JWT.
- **`POST /api/auth/refresh-token`** — Refresh expired access tokens.
- **`GET /api/auth/verify-email`** — Email verification via one-time token.
- **`POST /api/bookings/:id/checkin`** — QR-based check-in system.
- **`POST /api/bookings/:id/checkout`** — QR-based check-out system.

### 🔧 Changed
- JWT access token expiry changed from `7d` to `30d`.
- Field search now supports `sport`, `priceMin`, `priceMax`, `rating`, and `amenities` filters.

### 🐛 Fixed
- Fixed `WorkingFields` crash on empty amenities array.
- Fixed `TournamentPage` crash when bracket is not yet generated.

---

## [v1.0.0] – 2026-06-01  _Initial Release_

### ✨ Core APIs Launched
- `POST /api/auth/register` — User registration with email verification
- `POST /api/auth/login` — JWT-based authentication
- `POST /api/auth/logout` — Token invalidation
- `POST /api/auth/forgot-password` — Password reset flow
- `GET/PUT /api/users/profile` — Profile management
- `GET /api/fields` — Browse all fields with pagination
- `POST /api/fields` — Create field listing (Owner role)
- `GET /api/fields/:id` — Field details with reviews and availability
- `POST /api/bookings` — Create booking with conflict detection
- `GET /api/bookings` — User booking history
- `DELETE /api/bookings/:id` — Cancel booking with refund calculation

---

## API Versioning Policy

- All endpoints are prefixed with `/api/v1/` in production.
- **Breaking changes** will increment the **major** API version.
- **Non-breaking additions** increment the **minor** version.
- **Bug fixes** and internal changes increment the **patch** version.
- Deprecated endpoints will remain available for a minimum of **3 minor versions** before removal.

---

_Maintained by [Hasibullah Khan Alvie](https://github.com/Nicgott99) · hasibullah.khan.alvie@g.bracu.ac.bd_
