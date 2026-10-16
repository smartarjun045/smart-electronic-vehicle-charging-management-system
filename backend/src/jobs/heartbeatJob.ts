import Charger from '../models/Charger';
import * as ocpp from '../ocpp/ocppSimulator';

/** Periodic job: simulates each non-offline charger sending an OCPP Heartbeat. */
export function startHeartbeatJob(intervalMs = 30 * 1000) {
  setInterval(async () => {
    try {
      const chargers = await Charger.find({ status: { $ne: 'OFFLINE' } }).select('chargerCode').lean();
      chargers.forEach((c) => ocpp.heartbeat(c.chargerCode));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[jobs] heartbeat job failed', err);
    }
  }, intervalMs);
}
