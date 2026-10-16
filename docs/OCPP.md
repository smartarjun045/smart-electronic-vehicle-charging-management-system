# OCPP.md — OCPP Simulation Layer

## What this is

`backend/src/ocpp/ocppSimulator.ts` is an **academic simulation** of a
subset of the OCPP 1.6 JSON message protocol, used to demonstrate the
message flow between a charge point and a Central System (CSMS) as part of
a university project. It is called from `chargingSimulatorService.ts` at
the points in the charging lifecycle where a real OCPP charger would send
these messages.

## What this is NOT

- **Not** a certified OCPP Central System / CSMS.
- **Not** a real OCPP-J WebSocket server that physical or third-party
  virtual chargers can connect to over the network.
- **Not** validated against the official OCPP 1.6 JSON schema.

This is intentional, per the project's scope rules: physical charging
hardware and full protocol certification are explicitly out of scope for
the core academic deliverable. The module is deliberately isolated behind
a small function-call interface (`bootNotification`, `heartbeat`,
`statusNotification`, `authorize`, `startTransaction`, `meterValues`,
`stopTransaction`, `getRecentLog`) so that a real CSMS implementation (for
example, an open-source project like SteVe, or an OCPP-J client library
talking to real hardware) could be substituted later **without changing**
the booking or charging-session service code that calls it.

## Message types simulated

| Message | When it's simulated |
|---|---|
| `BootNotification` | Available as a function; not currently auto-invoked (chargers are seeded as already "booted") — call `ocppSimulator.bootNotification()` if demonstrating charger startup. |
| `Heartbeat` | Every 30s, for every non-`OFFLINE` charger (`jobs/heartbeatJob.ts`). |
| `StatusNotification` | On charger status transitions: `Preparing`, `Charging`, `Finishing`. |
| `Authorize` | When a checked-in user starts a charging session (the "idTag" is the user id, standing in for an RFID/app authorization). |
| `StartTransaction` | When the charging session begins (`meterStart: 0`). |
| `MeterValues` | Every simulation tick (default every 2s), carrying the cumulative energy in Wh. |
| `StopTransaction` | When the session completes or is manually stopped, carrying the final meter reading. |

## Inspecting the simulated log

As an admin, `GET /api/admin/ocpp-log?limit=100` returns the most recent
simulated messages across all chargers, each with a timestamp, charger
code, message type, and payload — useful for demonstrating the protocol
flow during a viva without needing a packet capture of a real OCPP session.

## Extension path to a real CSMS

1. Stand up an open-source CSMS (e.g. SteVe) or implement an OCPP-J
   WebSocket server.
2. Have physical/virtual chargers connect to it directly using the real
   protocol.
3. Replace the calls in `chargingSimulatorService.ts` to
   `ocpp/ocppSimulator.ts` with calls into your CSMS's client/adapter,
   keeping the same call sites (booking → check-in → session start/tick/
   stop) so the rest of the application (booking engine, billing, rewards,
   Socket.IO push to the frontend) requires no changes.
