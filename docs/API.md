# API.md — REST API Reference

Base URL: `http://localhost:5000/api`
Interactive docs (Swagger UI): `http://localhost:5000/api/docs`

All responses follow one of these shapes:

```json
// success
{ "success": true, "data": { ... } }

// error
{ "success": false, "error": { "code": "BOOKING_CONFLICT", "message": "..." } }
```

Authenticated routes require:
```
Authorization: Bearer <accessToken>
```

---

## Auth

| Method | Path                | Auth | Description |
|--------|----------------------|------|-------------|
| POST   | `/auth/register`      | —    | `{ name, email, password, phone? }` → `{ accessToken, refreshToken, user }` |
| POST   | `/auth/login`           | —    | `{ email, password }` → `{ accessToken, refreshToken, user }` |
| POST   | `/auth/logout`           | —    | Stateless JWT — discard tokens client-side. |
| GET    | `/auth/google`             | —    | Redirects to Google's consent screen. Not a JSON endpoint — used via `<a href>`/`window.location`, not fetch/axios. |
| GET    | `/auth/google/callback`      | —    | Google redirects here; on success redirects the browser to `${CLIENT_ORIGIN}/oauth-callback?token=<JWT>`. |
| GET    | `/auth/github`                 | —    | Redirects to GitHub's consent screen. |
| GET    | `/auth/github/callback`          | —    | GitHub redirects here; same success redirect as Google. |

Returns `501 OAUTH_NOT_CONFIGURED` if the relevant `GOOGLE_*`/`GITHUB_*` env
vars aren't set — see `docs/SETUP.md` §8.

## Users

| Method | Path         | Auth | Description |
|--------|--------------|------|-------------|
| GET    | `/users/me`   | User | Current user profile. |

## Vehicles

| Method | Path            | Auth | Description |
|--------|-----------------|------|-------------|
| POST   | `/vehicles`      | User | Create a vehicle profile. |
| GET    | `/vehicles`       | User | List the current user's vehicles. |
| DELETE | `/vehicles/:id`    | User | Delete a vehicle (must belong to the user). |

## Stations

| Method | Path                  | Auth | Description |
|--------|------------------------|------|-------------|
| GET    | `/stations/nearby`      | —    | `?lat=&lng=&radiusKm=&connectorType=&minPowerKW=&maxPricePerKWh=&onlyAvailable=&minRating=&renewableEnergy=&city=` |
| GET    | `/stations/:id`           | —    | Station details + its chargers. |
| GET    | `/stations`                 | —    | Paginated browse list. `?page=&limit=&city=` |

## Bookings

| Method | Path                    | Auth | Description |
|--------|--------------------------|------|-------------|
| POST   | `/bookings`                | User | `{ stationId, chargerId, vehicleId, startTime (ISO), durationMinutes }` → `{ booking, qrDataUrl }`. Returns `409 BOOKING_CONFLICT` on overlap. |
| GET    | `/bookings`                   | User | List current user's bookings. |
| GET    | `/bookings/:id`                 | User/Admin | Booking details. |
| PATCH  | `/bookings/:id/cancel`             | User/Admin | Cancel a `PENDING`/`CONFIRMED` booking. |
| POST   | `/bookings/check-in`                 | User | `{ qrToken }` → activates the booking (simulates a QR scan at the station). |

## Charging sessions

| Method | Path                  | Auth | Description |
|--------|------------------------|------|-------------|
| POST   | `/sessions/start`        | User | `{ bookingId }` — booking must be `ACTIVE` (checked in). Starts the virtual charger simulator. |
| POST   | `/sessions/:id/stop`       | User | Manually stop/finish a session early. |
| GET    | `/sessions/:id`               | User/Admin | Session details (battery %, energy, cost, status). |

Real-time updates for a session are pushed over Socket.IO to room
`user:<userId>`:
- `charging:started` — `{ sessionId, chargerId }`
- `charging:progress` — `{ sessionId, batteryPercentage, energyConsumedKWh, cost, powerKW, status }`
- `charging:completed` — `{ sessionId, finalBatteryPercentage, energyConsumedKWh, cost, rewardPoints, invoiceId }`
- `notification:new` — `{ title, message }`

## Payments / Invoices

| Method | Path                        | Auth | Description |
|--------|------------------------------|------|-------------|
| GET    | `/payments/mine`               | User | List the current user's invoices/payments. |
| GET    | `/payments/booking/:bookingId`   | User/Admin | Invoice for a specific booking. |

## Rewards

| Method | Path        | Auth | Description |
|--------|-------------|------|-------------|
| GET    | `/rewards`   | User | Green points transaction history. |

## Recommendations & range

| Method | Path                | Auth | Description |
|--------|----------------------|------|-------------|
| GET    | `/recommendations`     | —    | `?lat=&lng=&connectorType=&radiusKm=` → ranked stations with `score`, `reasons[]`, `breakdown`. |
| POST   | `/range/estimate`         | User | `{ vehicleId, lat, lng, destinationDistanceKm? }` → estimated range, sufficiency, and (if insufficient) suggested charging stations along the way. |

## Admin (all require `role: ADMIN`)

| Method | Path                                   | Description |
|--------|------------------------------------------|-------------|
| GET    | `/admin/analytics/overview`                | Dashboard summary cards. |
| GET    | `/admin/analytics/bookings-by-day`           | `?days=14` |
| GET    | `/admin/analytics/revenue-by-day`              | `?days=14` |
| GET    | `/admin/analytics/station-utilization`           | Sessions & occupied minutes per station. |
| GET    | `/admin/analytics/charger-status`                  | Count of chargers per status. |
| GET    | `/admin/users`                                        | List all users (no password hashes). |
| GET/POST | `/admin/stations`                                    | List / create stations. |
| PATCH  | `/admin/stations/:id`                                   | Update a station. |
| GET/POST | `/admin/chargers`                                      | List (optionally `?stationId=`) / create chargers. |
| PATCH  | `/admin/chargers/:id/status`                              | `{ status, maintenanceStatus }` |
| GET    | `/admin/bookings`                                            | Recent bookings (latest 200). |
| GET    | `/admin/sessions`                                              | Recent charging sessions (latest 200). |
| GET/POST | `/admin/maintenance`                                             | List / create maintenance records. |
| GET    | `/admin/ocpp-log`                                                  | Recent simulated OCPP message log (`?limit=`). |

## Error codes (non-exhaustive)

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Request body failed schema validation. |
| `UNAUTHENTICATED` | 401 | Missing/invalid access token. |
| `INVALID_CREDENTIALS` | 401 | Login email/password mismatch. |
| `FORBIDDEN` | 403 | Authenticated but not permitted (wrong role or not resource owner). |
| `EMAIL_TAKEN` | 409 | Registration email already in use. |
| `BOOKING_CONFLICT` | 409 | Requested slot overlaps an existing booking on that charger. |
| `STATION_NOT_FOUND` / `CHARGER_NOT_FOUND` / `VEHICLE_NOT_FOUND` / `BOOKING_NOT_FOUND` / `SESSION_NOT_FOUND` / `INVOICE_NOT_FOUND` | 404 | Resource not found. |
| `INVALID_QR` / `QR_NOT_VALID` / `QR_EXPIRED` / `TOO_EARLY` | 400/404 | QR check-in failures. |
| `NOT_FOUND` | 404 | Unknown route. |
| `INTERNAL_ERROR` | 500 | Unhandled server error. |
