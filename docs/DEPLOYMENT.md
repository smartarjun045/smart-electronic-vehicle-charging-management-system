# DEPLOYMENT.md

This project is built and tested for **local academic demonstration**.
Notes below describe how it *could* be deployed beyond that, and what
you'd need to change first.

## Local (recommended for the viva/demo)

Use Docker Compose (see root `README.md`) or the two-terminal `npm run
dev` setup. This is the supported, tested path.

## Containerized deployment (single host / VM)

`docker-compose.yml` builds production images for both services:
- `backend/Dockerfile` — multi-stage Node build, runs `node dist/server.js`
- `frontend/Dockerfile` — Vite production build served by nginx, which
  also reverse-proxies `/api` and `/socket.io` to the backend container

To run on a VM:
```bash
docker compose up --build -d
docker compose exec backend npm run seed   # only if you want demo data
```
Then put a reverse proxy with TLS (e.g. Caddy, nginx + certbot) in front of
port 8080, and set real secrets (see below).

## Before deploying anywhere beyond localhost

1. **Rotate secrets.** Set strong, unique `JWT_ACCESS_SECRET` and
   `JWT_REFRESH_SECRET` values (32+ random bytes) via environment
   variables or a secrets manager — never commit them.
2. **Use a managed or replica-set MongoDB.** The booking engine's
   transactional conflict check requires a replica set to get its
   strongest guarantee (see ARCHITECTURE.md); MongoDB Atlas or a
   self-hosted replica set both work. A standalone instance still
   functions via the documented fallback, but under concurrent load a
   replica set is recommended.
3. **Set `CLIENT_ORIGIN`** to your real frontend origin (CORS + Socket.IO).
4. **Enable HTTPS** end-to-end (the app assumes it sits behind TLS
   termination in production; cookies/tokens are not configured for
   secure-only behavior by default in this academic build).
5. **Review rate limits** (`RATE_LIMIT_WINDOW_MS`/`RATE_LIMIT_MAX`) for
   your expected traffic.
6. **Swap simulated payments for a real gateway** if this were to handle
   real transactions — see the "Structure the code so a real Indian
   payment gateway can be added later" note in `docs/LIMITATIONS.md` and
   `services/billingService.ts`. Do not process real payments with the
   current `SIMULATED_WALLET` payment method.
7. **Do not treat any charging/session/availability data as real
   infrastructure telemetry** in a public deployment — see
   `docs/LIMITATIONS.md`. This project simulates chargers; it does not
   control real hardware.

## Environment variable summary

See `docs/SETUP.md` §3 and `backend/.env.example` / `frontend/.env.example`.
