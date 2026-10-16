Aggregation-based analytics currently live in `services/analyticsService.ts`
for simplicity. This directory is reserved for a future ML demand
-forecasting module (see docs/LIMITATIONS.md, "Not implemented" — Random
Forest / XGBoost LOW/MEDIUM/HIGH demand output), which would read from the
same Booking/ChargingSession collections without changing the existing
analytics API routes.
