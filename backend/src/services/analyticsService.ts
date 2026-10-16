import Booking from '../models/Booking';
import ChargingSession from '../models/ChargingSession';
import Payment from '../models/Payment';
import ChargingStation from '../models/ChargingStation';
import Charger from '../models/Charger';
import User from '../models/User';

export async function getOverview() {
  const [totalUsers, activeStations, availableChargers, activeSessions, todaysBookings, todaysRevenueAgg] =
    await Promise.all([
      User.countDocuments({}),
      ChargingStation.countDocuments({ status: 'ACTIVE' }),
      Charger.countDocuments({ status: 'AVAILABLE' }),
      ChargingSession.countDocuments({ status: 'CHARGING' }),
      Booking.countDocuments({ createdAt: { $gte: startOfToday() } }),
      Payment.aggregate([
        { $match: { createdAt: { $gte: startOfToday() }, status: 'SUCCESS' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

  return {
    totalUsers,
    activeStations,
    availableChargers,
    activeSessions,
    todaysBookings,
    todaysRevenue: todaysRevenueAgg[0]?.total ?? 0,
  };
}

export async function getBookingsByDay(days = 14) {
  const since = new Date(Date.now() - days * 86400000);
  return Booking.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export async function getRevenueByDay(days = 14) {
  const since = new Date(Date.now() - days * 86400000);
  return Payment.aggregate([
    { $match: { createdAt: { $gte: since }, status: 'SUCCESS' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export async function getStationUtilization() {
  const stations = await ChargingStation.find({}).lean();
  const results: Array<{
    stationId: unknown;
    name: string;
    sessionsCompleted: number;
    occupiedMinutes: number;
  }> = [];
  for (const station of stations) {
    const chargers = await Charger.find({ stationId: station._id }).lean();
    const chargerIds = chargers.map((c) => c._id);
    const sessions = await ChargingSession.find({ chargerId: { $in: chargerIds }, status: 'COMPLETED' }).lean();
    const occupiedMinutes = sessions.reduce((sum, s) => {
      if (!s.startedAt || !s.endedAt) return sum;
      return sum + (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000;
    }, 0);
    results.push({
      stationId: station._id,
      name: station.name,
      sessionsCompleted: sessions.length,
      occupiedMinutes: Math.round(occupiedMinutes),
    });
  }
  return results;
}

export async function getChargerStatusBreakdown() {
  return Charger.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
