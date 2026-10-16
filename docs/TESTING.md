# TESTING.md

## Running tests

```bash
cd backend
npm test
```

Uses Jest + ts-jest. Config: `backend/jest.config.js`.

## What's currently covered

- `src/__tests__/geo.test.ts` — Haversine distance correctness (identity
  case, and a realistic Bandra→Colaba distance sanity check).
- `src/__tests__/recommendation.test.ts` — recommendation engine weight
  configuration sums to 1.0 (guards against an unbalanced scoring change).

These are intentionally **pure-function, no-database tests** so they run
anywhere without a MongoDB instance — suitable for CI.

## What's documented but not yet automated (extend here)

The project spec calls for a broader test suite. The architecture supports
adding these without restructuring; recommended next tests, using
`mongodb-memory-server` (an in-memory MongoDB for tests) or a disposable
Docker MongoDB, plus `supertest` (already a dev dependency) against
`createApp()` from `src/app.ts`:

- **Authentication**: register → duplicate email rejected (409); login with
  wrong password rejected (401); JWT required on protected routes (401).
- **Authorization**: a `USER` token hitting any `/api/admin/*` route
  receives 403; an `ADMIN` token succeeds.
- **Station search & distance**: seed two stations at known coordinates,
  assert `/stations/nearby` returns them in correct distance order and
  respects `radiusKm`.
- **Booking conflict**: create a booking, then attempt an overlapping
  booking on the same charger → expect `409 BOOKING_CONFLICT`; a
  non-overlapping booking on the same charger succeeds.
- **Booking cancellation**: cancel a `CONFIRMED` booking → status
  `CANCELLED`; cancelling a `COMPLETED` booking → `400 INVALID_STATUS`.
- **QR validation**: check in with a valid token before the window opens →
  `400 TOO_EARLY`; after `endTime` → `400 QR_EXPIRED`; with an unknown
  token → `404 INVALID_QR`.
- **Billing**: given a session's `energyConsumedKWh` and a station's
  `pricePerKWh`/`parkingFee`, assert `createInvoiceForSession` computes the
  expected total (energy + parking + flat booking fee).
- **Recommendation engine**: with two stations of known distance/price/
  availability, assert the closer, cheaper, more-available station scores
  higher.
- **Charging session lifecycle**: start a session on a mocked/short tick
  interval, assert it transitions `NOT_STARTED → CHARGING → COMPLETED` and
  that the charger's status follows `PREPARING → CHARGING → FINISHING →
  AVAILABLE`.
- **Socket events**: using `socket.io-client` against a test server
  instance, assert `charging:progress` and `charging:completed` are
  emitted only to the owning user's room.
- **Admin permissions**: exhaustive check that every `/api/admin/*` route
  rejects non-admin tokens.

## End-to-end scenario (manual or Playwright)

The full target E2E flow (per project spec §33) is:

```
Login → Find station → Book → Check-in → Start charging
  → Receive progress (Socket.IO) → Complete → Generate invoice
```

This is exercised manually via the walkthrough in the root `README.md`. To
automate it with Playwright: install `@playwright/test` in `frontend/`,
point it at a `npm run dev` instance with a freshly-seeded backend, and
script exactly those steps using `data-testid` attributes (not yet added to
components — a good first contribution if extending this test suite).
