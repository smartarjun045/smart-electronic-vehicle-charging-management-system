# SETUP.md — Detailed Setup & Troubleshooting

## 1. Prerequisites

- Node.js 18.18+ (20.x LTS recommended) — https://nodejs.org
- npm 9+ (bundled with Node.js)
- MongoDB 6+ — either:
  - installed locally (https://www.mongodb.com/try/download/community), or
  - run via Docker: `docker run -d -p 27017:27017 --name evsync-mongo mongo:7`
- (Optional) Docker + Docker Compose for the one-command setup

See also [`requirements.txt`](../requirements.txt).

## 2. Clone & install

```bash
git clone <this-repo-url> evsync
cd evsync

cd backend
cp .env.example .env
npm install

cd ../frontend
cp .env.example .env
npm install
```

## 3. Configure environment variables

`backend/.env` (copied from `.env.example`):

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `5000` | API port |
| `NODE_ENV` | `development` | |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS + Socket.IO origin — must match the frontend's dev server URL |
| `MONGO_URI` | `mongodb://localhost:27017/evsync` | |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | placeholder | **Change these before any non-local use.** |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | `900000` / `300` | Global `/api` rate limit |
| `CHARGING_TICK_MS` | `2000` | How often the virtual charger simulator updates — lower this for a faster demo, raise it for a slower/more realistic one |

`frontend/.env`: not required for local dev (the Vite dev server proxies
`/api` and `/socket.io` to `http://localhost:5000` — see
`frontend/vite.config.ts`). Only needed if you serve the frontend build
separately from the API (see `VITE_API_BASE_URL` in `.env.example`).

## 4. Seed the database

```bash
cd backend
npm run seed
```

This clears and repopulates: 3 demo users (1 admin, 2 regular), 1 vehicle,
25 Mumbai/MMR/Maharashtra charging stations with 2–5 chargers each, and one
historical completed booking/session/payment/reward so the demo account
isn't empty on first login.

Re-run `npm run seed` any time to reset to a clean demo state.

## 5. Run in development

Two terminals:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Visit http://localhost:5173.

## 6. Run with Docker Compose

```bash
docker compose up --build
docker compose exec backend npm run seed   # one-time
```

Frontend: http://localhost:8080 · API: http://localhost:5000/api

To stop: `docker compose down` (add `-v` to also delete the MongoDB volume).

## 8. OAuth setup — Sign in with Google / GitHub

Google and GitHub sign-in/sign-up are optional. Without credentials
configured, the "Continue with Google/GitHub" buttons will redirect and
show a clear "not configured" error rather than breaking the rest of the
app — email/password auth always works regardless.

**Google:**
1. Go to https://console.cloud.google.com/apis/credentials → **Create
   Credentials → OAuth client ID** → Application type **Web application**.
2. Authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
   (swap the host for your deployed `API_BASE_URL` in production).
3. Copy the Client ID/Secret into `backend/.env`:
   `GOOGLE_CLIENT_ID=...` / `GOOGLE_CLIENT_SECRET=...`.

**GitHub:**
1. Go to https://github.com/settings/developers → **New OAuth App**.
2. Homepage URL: `http://localhost:5173` (your frontend).
   Authorization callback URL: `http://localhost:5000/api/auth/github/callback`.
3. Copy the Client ID/Secret into `backend/.env`:
   `GITHUB_CLIENT_ID=...` / `GITHUB_CLIENT_SECRET=...`.

Restart the backend after editing `.env`. Make sure `API_BASE_URL` in
`backend/.env` matches the redirect URIs you registered, and
`CLIENT_ORIGIN` matches your frontend URL (the backend redirects back to
`${CLIENT_ORIGIN}/oauth-callback?token=...` on success).

A user who signs up via Google/GitHub has no local password — if they
later try to log in with email/password using that same email, they'll get
a clear message to use the OAuth button instead. If they sign up locally
first and later use Google/GitHub with the same email, the accounts are
automatically linked (matched by email).

## 9. Common issues

**"MongooseServerSelectionError: connect ECONNREFUSED"**
MongoDB isn't running or `MONGO_URI` is wrong. Start MongoDB locally or via
Docker, and confirm the URI in `backend/.env`.

**CORS errors in the browser console**
`CLIENT_ORIGIN` in `backend/.env` must exactly match the URL you're loading
the frontend from (including port).

**Socket.IO events never arrive on the charging screen**
Confirm you're logged in (the socket handshake sends the JWT) and that the
backend's `CLIENT_ORIGIN` matches. Check the Network tab for a
`socket.io` websocket connection with status 101.

**"Transaction numbers are only allowed on a replica set member"**
This means MongoDB is running as a standalone instance without replica-set
support. This is expected in many local/academic setups — the booking
engine automatically falls back to a non-transactional conflict check in
this case (see `bookingService.createBooking`), so booking still works;
only the strongest atomicity guarantee is relaxed. See LIMITATIONS.md.

**Leaflet map tiles don't load / markers missing icons**
Check your network connection — map tiles load from
`tile.openstreetmap.org` and marker icons from `unpkg.com` at runtime (see
`MapPage.tsx`). If you're behind a restrictive firewall/proxy, allow these
hosts.

**Ports already in use**
Change `PORT` in `backend/.env` and the `server.proxy` targets /
`server.port` in `frontend/vite.config.ts` accordingly, or stop whatever
else is using 5000/5173/27017.
