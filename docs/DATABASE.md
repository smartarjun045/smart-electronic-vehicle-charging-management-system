# DATABASE.md — Schema & Relationships

MongoDB via Mongoose. All collections use Mongoose's default `_id`
(ObjectId) as primary key. Timestamps (`createdAt`/`updatedAt`) are added
automatically where noted.

## Collections

### User
| Field | Type | Notes |
|---|---|---|
| name, email (unique), phone?, passwordHash, role (`USER`\|`ADMIN`\|`STATION_OPERATOR`), verified, avatar?, greenPoints | | timestamps: yes |

### Vehicle
| Field | Type | Notes |
|---|---|---|
| userId | ref User | |
| manufacturer, model, batteryCapacityKWh, currentBatteryPercentage, connectorType, registrationNumber, chargingSpeedKW, efficiencyKmPerKWh | | createdAt only |

### ChargingStation
| Field | Type | Notes |
|---|---|---|
| name, operator, address, city, state, pincode, latitude, longitude, openingHours, amenities[], renewableEnergy, rating, totalChargers, availableChargers (derived — see below), pricePerKWh, parkingFee, status (`ACTIVE`\|`INACTIVE`\|`MAINTENANCE`), images[] | | timestamps: yes |

`totalChargers`/`availableChargers` are **denormalized counters**,
recalculated by `stationService.recalculateAvailability()` whenever a
charger's status changes (booking check-in, session start/finish, admin
status update). This trades a small amount of write amplification for fast
reads on the station list/map, which is read far more often than chargers
change status.

### Charger
| Field | Type | Notes |
|---|---|---|
| stationId | ref ChargingStation | indexed |
| chargerCode, connectorType, powerKW, chargingType (`AC`\|`DC`), status, currentSessionId?, lastHeartbeat, ocppStatus, maintenanceStatus | | timestamps: yes |

Status enum: `AVAILABLE, PREPARING, CHARGING, SUSPENDED, FINISHING, FAULTED, UNAVAILABLE, OFFLINE`

### Booking
| Field | Type | Notes |
|---|---|---|
| userId, stationId, chargerId, vehicleId | refs | |
| startTime, endTime, durationMinutes | | |
| status | `PENDING\|CONFIRMED\|ACTIVE\|COMPLETED\|CANCELLED\|EXPIRED\|NO_SHOW` | |
| qrToken | unique string (UUID) | opaque — no PII |
| paymentStatus | `UNPAID\|PAID\|REFUNDED` | |

Compound index `{ chargerId, status, startTime, endTime }` supports the
overlap-conflict query used by the booking engine (see ARCHITECTURE.md).

### ChargingSession
| Field | Type | Notes |
|---|---|---|
| bookingId, userId, chargerId | refs | |
| startedAt?, endedAt? | | |
| initialBatteryPercentage, finalBatteryPercentage, energyConsumedKWh, chargingPowerKW, cost | | |
| status | `NOT_STARTED\|CHARGING\|SUSPENDED\|COMPLETED\|FAULTED` | |
| meterValues[] | `{ timestamp, batteryPercentage, energyConsumedKWh, powerKW }` | simulated telemetry log, appended each tick |

### Payment
| Field | Type | Notes |
|---|---|---|
| bookingId, userId | refs | |
| amount, currency, paymentMethod, transactionId (unique), status (`PENDING\|SUCCESS\|FAILED\|REFUNDED`) | | |
| breakdown | `{ energyCost, parkingFee, bookingFee }` | |
| paidAt? | | |

`paymentMethod` defaults to `SIMULATED_WALLET` — see LIMITATIONS.md. The
schema is intentionally payment-gateway-agnostic (amount, currency,
transactionId, status) so a real Indian payment gateway integration could
populate the same fields without changing the booking/session code.

### Reward
| Field | Type | Notes |
|---|---|---|
| userId | ref | |
| points, reason, transactionType (`EARNED\|REDEEMED`) | | createdAt only |

### MaintenanceRecord
| Field | Type | Notes |
|---|---|---|
| chargerId | ref | |
| issue, severity (`LOW\|MEDIUM\|HIGH\|CRITICAL`), description, status (`OPEN\|IN_PROGRESS\|RESOLVED`), resolvedAt? | | createdAt only |

## Entity relationship summary

```
User 1───* Vehicle
User 1───* Booking
User 1───* Reward
User 1───* Payment

ChargingStation 1───* Charger
ChargingStation 1───* Booking

Charger 1───* Booking
Charger 1───* MaintenanceRecord
Charger 1───0..1 ChargingSession (currentSessionId, while active)

Booking 1───1 ChargingSession
Booking 1───0..1 Payment
Vehicle 1───* Booking

ChargingSession 1───1 Payment (via Booking)
```

## Scaling notes

- For datasets beyond a few hundred stations, add a GeoJSON `location`
  field + `2dsphere` index to `ChargingStation` and switch
  `stationService.findNearbyStations` to `$geoNear` (see ARCHITECTURE.md).
- `Booking`'s compound index keeps the conflict check fast; for very high
  write concurrency in production, consider a dedicated per-charger lock
  document or a unique partial index instead of relying solely on
  application-level transactions.
