# ARCHITECTURE.md

## System overview

```
React Frontend (Vite, TS, Tailwind, Leaflet)
        |
        | REST (axios, /api/*)  +  WebSocket (Socket.IO)
        v
Node.js + Express Backend (TypeScript)
        |
        +---- MongoDB (Mongoose)              persistent storage
        |
        +---- Socket.IO server                 real-time push (charger status,
        |                                       booking updates, charging
        |                                       progress, notifications)
        |
        +---- OCPP simulation module            academic OCPP 1.6-inspired
        |     (src/ocpp/ocppSimulator.ts)        message log, called from the
        |                                        charging session lifecycle
        |
        +---- Recommendation engine             transparent weighted scoring
        |     (src/services/recommendationService.ts)
        |
        +---- Range estimator                   deterministic (non-ML) range
        |     (src/services/rangeService.ts)     calculation
        |
        +---- Billing / invoicing                simulated payment layer
        |     (src/services/billingService.ts)
        |
        +---- Background jobs                    booking expiry, charger
              (src/jobs/*)                        heartbeats
```

## Backend layering

```
src/
├── config/        env, DB connection, Swagger config
├── controllers/    thin HTTP handlers — parse request, call a service, respond
├── services/        business logic (booking engine, simulator, billing, ...)
├── repositories/    (extension point — see "Scaling station discovery" below;
│                     station/charger queries currently live directly in
│                     services/stationService.ts for this scope)
├── models/           Mongoose schemas
├── routes/            Express routers, one per resource
├── middlewares/       auth (JWT), RBAC, validation, error handling
├── validators/         Zod schemas for request bodies
├── utils/               ApiError, apiResponse helpers, geo (Haversine), JWT helpers
├── sockets/              Socket.IO server + auth handshake
├── ocpp/                  OCPP simulation module
├── jobs/                   setInterval-based background jobs
└── scripts/seed.ts          demo data seeding (Mumbai/MMR/Maharashtra)
```

Controllers never touch Mongoose models directly for write-critical logic
(bookings, sessions, billing) — that logic lives in `services/` so it can be
unit-tested and reused (e.g. by the seed script, by background jobs).

## Data flow: the core demo scenario

```
User selects station on map (Leaflet + OpenStreetMap tiles)
  → GET /api/stations/nearby (Haversine distance filter)
User books a slot
  → POST /api/bookings
      → bookingService.createBooking()
          → conflict check inside a MongoDB session/transaction:
              existingStart < requestedEnd AND existingEnd > requestedStart
          → Booking created with a random UUID qrToken
      → QR code image generated (qrcode package) from the token only
User "arrives" and checks in
  → POST /api/bookings/check-in { qrToken }
      → booking status CONFIRMED → ACTIVE
User starts charging
  → POST /api/sessions/start { bookingId }
      → chargingSimulatorService.startChargingSession()
          → charger status → PREPARING → CHARGING
          → ChargingSession document created
          → setInterval "tick" loop begins (see below)
Each tick (every CHARGING_TICK_MS, default 2s):
  → battery %, energy (kWh), cost recalculated
  → OCPP MeterValues message recorded (ocppSimulator)
  → Socket.IO emits `charging:progress` to room `user:<id>`
  → frontend ChargingSessionPage updates live, no refresh
On completion (battery reaches 100% or user clicks Stop):
  → charger status → FINISHING → AVAILABLE (after a short delay)
  → booking status → COMPLETED, paymentStatus → PAID
  → invoice (Payment document) generated (billingService)
  → green points awarded (rewardService)
  → Socket.IO emits `charging:completed` + `notification:new`
Admin dashboard
  → GET /api/admin/analytics/* — reads the same collections directly via
    aggregation pipelines, so it reflects the new booking/session/revenue
    immediately on next poll/refresh.
```

## Distance algorithm (station discovery)

`utils/geo.ts` implements the Haversine great-circle distance formula, used
by both `stationService.findNearbyStations` and
`recommendationService.recommendStations`. A bounding-box pre-filter
(±radius/111° latitude, longitude-corrected) narrows the MongoDB query
before the precise Haversine calculation runs in application code — this
keeps the approach fast for a demo-sized dataset (tens to low hundreds of
stations) without requiring a geospatial index.

**Scaling station discovery:** for a larger, production-sized dataset, the
extension point is to add a GeoJSON `location: { type: 'Point', coordinates
: [lng, lat] }` field to `ChargingStation`, a `2dsphere` index on it, and
replace the bounding-box + Haversine pass in `stationService.ts` with a
native `$geoNear` aggregation stage. The service function signature
(`findNearbyStations`) would not need to change, only its implementation —
this is intentionally isolated so that migration is contained to one file.

## Booking conflict algorithm

See `services/bookingService.ts`. Two bookings for the same charger conflict
when their `[startTime, endTime)` intervals overlap:

```
existingStart < requestedEnd  AND  existingEnd > requestedStart
```

Only bookings with status `PENDING`, `CONFIRMED`, or `ACTIVE` are considered
occupying. The check-and-insert is wrapped in a MongoDB
`ClientSession.withTransaction(...)` when available (replica-set MongoDB);
on a standalone MongoDB instance (common for local academic setups, where
transactions aren't supported), the code falls back to a best-effort
non-transactional check. This is documented as a known limitation for high
-concurrency production use — see `docs/LIMITATIONS.md`.

## Recommendation algorithm

See `services/recommendationService.ts`. A fully transparent, weighted
linear scoring function (weights sum to 1.0, configurable):

```
score = 0.25·availability + 0.20·distance + 0.20·chargingSpeed
      + 0.15·price + 0.10·waitingTime + 0.10·rating
```

Every sub-score is a normalized value in `[0, 1]` computed from the same
data shown to the user, and the "reasons" array returned alongside the
score is derived from those same inputs — so the explanation always matches
the number. This is intentionally **not** a black-box / ML model, per the
project's "no fake AI labels on simple logic" requirement — nothing here is
labelled "AI" in the UI.

## Real-time architecture (Socket.IO)

- Clients connect with a JWT in the Socket.IO handshake (`auth.token`).
- Authenticated sockets join a private `user:<userId>` room; charging
  progress/completion and notifications are emitted only to that room.
- Admins additionally join an `admin` room (reserved for future
  admin-specific push events; the current admin dashboard polls REST
  endpoints on load, which is sufficient at this data volume — see
  `docs/LIMITATIONS.md` for the tradeoff).
- Anonymous (unauthenticated) sockets are still accepted, for future public
  station-status broadcasts, but receive no private events.

## OCPP simulation architecture

See `docs/OCPP.md` for details. In short: `ocpp/ocppSimulator.ts` is an
isolated module simulating OCPP 1.6 JSON message shapes and is called from
`chargingSimulatorService.ts` at the relevant lifecycle points
(Authorize/StatusNotification on prepare, StartTransaction on charging
start, MeterValues per tick, StopTransaction + StatusNotification on
completion), plus a periodic Heartbeat job. It does not open a real OCPP
WebSocket endpoint for physical charge points.

## Security

- Passwords hashed with bcrypt (12 salt rounds) — never stored in plaintext.
- JWT access tokens (short-lived) signed with a server-side secret; roles
  (`USER` / `ADMIN` / `STATION_OPERATOR`) are enforced in Express
  middleware (`requireAuth`, `requireRole`) on the backend, not just hidden
  in the frontend UI.
- All admin routes (`/api/admin/*`) require `requireRole('ADMIN')`.
- Input validation via Zod schemas (`validators/`) on all mutating routes.
- `helmet` for secure HTTP headers, `cors` scoped to `CLIENT_ORIGIN`, and a
  global rate limiter (`express-rate-limit`) on all `/api` routes.
- QR tokens are opaque UUIDs — no user PII is encoded in the QR payload.
- Secrets are read from environment variables only; `.env` is git-ignored
  and `.env.example` is provided with placeholder values.

## Frontend architecture

- React Router for page navigation; `ProtectedRoute` gates authenticated
  and admin-only pages.
- `AuthContext` holds the current user and JWT (stored in `localStorage`),
  with an axios interceptor attaching the bearer token to every request.
- `useSocket` hook manages a single authenticated Socket.IO connection per
  mounted component that needs live updates (currently the charging session
  page).
- Tailwind CSS utility classes plus a small set of shared component classes
  (`.card`, `.btn-primary`, etc.) in `index.css` for visual consistency
  without a component library dependency.
