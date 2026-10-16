import { expireStaleBookings } from '../services/bookingService';

/** Periodic job: expires CONFIRMED bookings whose window has passed without check-in. */
export function startExpireBookingsJob(intervalMs = 5 * 60 * 1000) {
  setInterval(async () => {
    try {
      const count = await expireStaleBookings();
      if (count > 0) {
        // eslint-disable-next-line no-console
        console.log(`[jobs] expired ${count} stale booking(s)`);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[jobs] expireStaleBookings failed', err);
    }
  }, intervalMs);
}
