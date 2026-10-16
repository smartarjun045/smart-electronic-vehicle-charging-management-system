This directory is an intentional extension point (see docs/ARCHITECTURE.md,
"Scaling station discovery"). For this build's scope, station/charger data
access is simple enough to live directly in `services/stationService.ts`.
If the query layer grows (e.g. a `$geoNear` migration, caching, or
multiple data sources), extract the relevant queries into repository
modules here, keeping the service-layer function signatures unchanged.
