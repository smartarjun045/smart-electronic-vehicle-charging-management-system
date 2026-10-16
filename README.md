# ⚡ Smart Electronic Vehicle Charging Management System

**Smart Electronic Vehicle Charging Management System — a full-stack platform for discovering EV charging stations, booking charging slots, and tracking simulated charging sessions.**

Smart Electronic Vehicle Charging Management System is an academic (4th-year engineering project) full-stack platform for
discovering EV charging stations, booking charging slots, checking in via QR
code, and running a **simulated** real-time charging session — end to end,
locally, with **no physical EV charging hardware required**.

Works anywhere in India: Smart Electronic Vehicle Charging Management System locates you (browser geolocation, or search
any city/area by name) and finds nearby charging stations from there —
Mumbai is just where the seed data is densest.

> 📌 **Academic transparency note:** charger availability, charging
> sessions, energy consumption, and payments in this project are
> **simulated** for demonstration. Map data (OpenStreetMap) and your own
> account/booking data are real. See [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md)
> for the full real vs. simulated vs. estimated breakdown.

---

## What's implemented

This build focuses on making the **complete end-to-end demo flow work
solidly** rather than shipping every optional feature half-finished. See
[`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) for exactly what's in scope
vs. deferred (e.g. ML demand forecasting, a full OCPP WebSocket CSMS, and
some admin CRUD screens are stubbed at the API level but not the full UI).

**Working end-to-end:**
- Registration / login (JWT + bcrypt), role-based access control (USER / ADMIN)
- Vehicle profiles
- Station discovery: nearby search (Haversine), filters, Leaflet + OpenStreetMap map
- Transparent, explainable station recommendation scoring engine
- Deterministic range-aware suggestion (battery % × capacity × efficiency)
- Booking engine with **real server-side double-booking prevention**
  (MongoDB transaction + interval-overlap check, with a safe fallback for
  standalone MongoDB instances that don't support transactions)
- Secure QR check-in (token-only, no PII encoded)
- Virtual charging session simulator with live Socket.IO progress updates
  (battery %, energy, cost)
- Academic OCPP 1.6-*inspired* message simulation (BootNotification,
  Heartbeat, StatusNotification, Authorize, StartTransaction, MeterValues,
  StopTransaction) — see [`docs/OCPP.md`](docs/OCPP.md)
- Billing engine + downloadable-style invoice records
- Green Points rewards
- Admin analytics overview (users, stations, chargers, sessions, revenue,
  bookings-by-day, charger status breakdown) via a real REST API + dashboard
- Swagger/OpenAPI docs at `/api/docs`
- **Locate yourself anywhere in India**: browser geolocation ("Use my
  current location") or search any city/area by name (OpenStreetMap
  Nominatim geocoding) — nearby search then runs against real coordinates,
  not a fixed city list
- Seed script with realistic (clearly-labelled demo) stations across
  Mumbai/MMR (densest coverage), the rest of Maharashtra, and major cities
  nationwide (Delhi NCR, Bengaluru, Chennai, Kolkata, Hyderabad, Ahmedabad,
  Jaipur, and more — see `backend/src/scripts/seed.ts`)

---

## Project structure

```
smart-electronic-vehicle-charging-management-system/
├── backend/            Node.js + Express + TypeScript + MongoDB API
├── frontend/            React + Vite + TypeScript + Tailwind + Leaflet
├── docs/                 Architecture, API, database, OCPP, setup, limitations docs
├── docker-compose.yml    One-command local stack (Mongo + backend + frontend)
├── requirements.txt      System prerequisites (see note inside — this is a Node.js project)
└── README.md             You are here
```

---

## Option A: Run with Docker (fastest)

```bash
git clone <this-repo-url> smart-electronic-vehicle-charging-management-system && cd smart-electronic-vehicle-charging-management-system
docker compose up --build
```

Then, once containers are up, seed the database (one-time):

```bash
docker compose exec backend npm run seed
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:5000/api
- API docs (Swagger): http://localhost:5000/api/docs

---

## Option B: Run locally without Docker

### 1. Prerequisites
See [`requirements.txt`](requirements.txt): Node.js 18+, npm, and a running
MongoDB instance (local install or `docker run -p 27017:27017 mongo:7`).

### 2. Backend

```bash
cd backend
cp .env.example .env        # edit JWT secrets etc. if you like
npm install
npm run seed                # populates demo stations nationwide + demo users
npm run dev                 # starts the API on http://localhost:5000
```

### 3. Frontend (in a second terminal)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # starts the app on http://localhost:5173
```

Open **http://localhost:5173**.

---

## Demo credentials

Created by `npm run seed`:

| Role  | Email              | Password      |
|-------|--------------------|---------------|
| Admin | admin@smart-ev-charging.demo  | Password123!  |
| User  | user@smart-ev-charging.demo   | Password123!  |

The demo user already has a saved vehicle (Tata Nexon EV) and one
historical completed charging session with an invoice and reward points, so
you can see populated screens immediately.

---

## Full demo walkthrough (matches the project's target demo scenario)

1. Log in as `user@smart-ev-charging.demo`.
2. On the home page, Smart Electronic Vehicle Charging Management System shows nearby Mumbai charging stations
   (uses your browser location if you allow it, otherwise defaults to
   Bandra Kurla Complex) plus a "Recommended for you" section with a
   transparent "why this station" explanation.
3. Open a station → **Book Now** → pick an available charger, your vehicle,
   a start time and duration → **Confirm booking**. The booking engine
   checks for conflicts server-side before confirming.
4. A QR code is generated. Go to **Bookings → booking detail** and click
   **"Simulate QR check-in"** (stands in for scanning the code on arrival).
5. Click **Start charging session** — the virtual charger simulator takes
   over: battery %, energy consumed, and cost update live via Socket.IO
   without a page refresh.
6. When charging completes (or you click **Stop**), an invoice is
   generated and green points are credited automatically.
7. Check **Rewards** and **Invoices** to see the results.
8. Log in as `admin@smart-ev-charging.demo` and open **Admin** to see the dashboard
   update with the new booking/session/revenue.

---

## Testing

```bash
cd backend
npm test
```

See [`docs/TESTING.md`](docs/TESTING.md) for what's covered and how to extend it.

---

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system architecture & data flow
- [`docs/API.md`](docs/API.md) — REST API reference
- [`docs/DATABASE.md`](docs/DATABASE.md) — schema & relationships
- [`docs/OCPP.md`](docs/OCPP.md) — OCPP simulation layer
- [`docs/SETUP.md`](docs/SETUP.md) — detailed setup/troubleshooting
- [`docs/TESTING.md`](docs/TESTING.md) — test coverage & how to run
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deployment notes
- [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) — **what's real vs. simulated vs. estimated, and what's out of scope for this build**

## License

MIT — see [`LICENSE`](LICENSE). This is original code; it does not clone or
rebrand any existing EV charging application. Third-party open-source
packages retain their own licenses (see each `package.json`).

## Contributor

- [MinakshiShirtode](https://github.com/MinakshiShirtode)
