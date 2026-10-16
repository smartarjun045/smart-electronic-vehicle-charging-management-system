/* eslint-disable no-console */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../config/env';
import User from '../models/User';
import Vehicle from '../models/Vehicle';
import ChargingStation from '../models/ChargingStation';
import Charger from '../models/Charger';
import Booking from '../models/Booking';
import ChargingSession from '../models/ChargingSession';
import Payment from '../models/Payment';
import Reward from '../models/Reward';
import { recalculateAvailability } from '../services/stationService';

// NOTE: This is clearly-labelled DEMO/SEED data for local academic
// demonstration, not live real-world station or pricing information.
// See docs/LIMITATIONS.md and section 35 of the project spec.

const STATIONS = [
  // ---- Mumbai Metropolitan Region, Maharashtra (dense home-turf coverage) ----
  { name: 'BKC EV Hub', area: 'Bandra Kurla Complex', city: 'Mumbai', state: 'Maharashtra', lat: 19.0656, lng: 72.8678, operator: 'Tata Power EZ Charge' },
  { name: 'Colaba Causeway Charge Point', area: 'Colaba', city: 'Mumbai', state: 'Maharashtra', lat: 18.9152, lng: 72.8258, operator: 'ChargeZone' },
  { name: 'Worli Sea Face Charging Station', area: 'Worli', city: 'Mumbai', state: 'Maharashtra', lat: 19.0176, lng: 72.8168, operator: 'Statiq' },
  { name: 'Lower Parel Mall Charger', area: 'Lower Parel', city: 'Mumbai', state: 'Maharashtra', lat: 19.0000, lng: 72.8300, operator: 'Tata Power EZ Charge' },
  { name: 'Dadar TT Circle Station', area: 'Dadar', city: 'Mumbai', state: 'Maharashtra', lat: 19.0178, lng: 72.8478, operator: 'Ather Grid' },
  { name: 'Bandra West Charging Bay', area: 'Bandra', city: 'Mumbai', state: 'Maharashtra', lat: 19.0596, lng: 72.8295, operator: 'ChargeZone' },
  { name: 'Andheri MIDC Fast Charge', area: 'Andheri', city: 'Mumbai', state: 'Maharashtra', lat: 19.1197, lng: 72.8468, operator: 'Statiq' },
  { name: 'Santacruz Airport Road Hub', area: 'Santacruz', city: 'Mumbai', state: 'Maharashtra', lat: 19.0821, lng: 72.8416, operator: 'Tata Power EZ Charge' },
  { name: 'Kurla Phoenix Market City Charger', area: 'Kurla', city: 'Mumbai', state: 'Maharashtra', lat: 19.0860, lng: 72.8886, operator: 'ChargeZone' },
  { name: 'Chembur Diamond Garden Station', area: 'Chembur', city: 'Mumbai', state: 'Maharashtra', lat: 19.0522, lng: 72.9005, operator: 'Statiq' },
  { name: 'Vikhroli Godrej Hillside Charger', area: 'Vikhroli', city: 'Mumbai', state: 'Maharashtra', lat: 19.1102, lng: 72.9257, operator: 'Ather Grid' },
  { name: 'Bhandup Charging Point', area: 'Bhandup', city: 'Mumbai', state: 'Maharashtra', lat: 19.1440, lng: 72.9370, operator: 'ChargeZone' },
  { name: 'Mulund Check Naka Fast Charge', area: 'Mulund', city: 'Mumbai', state: 'Maharashtra', lat: 19.1726, lng: 72.9570, operator: 'Statiq' },
  { name: 'Powai Hiranandani Charger', area: 'Powai', city: 'Mumbai', state: 'Maharashtra', lat: 19.1176, lng: 72.9060, operator: 'Tata Power EZ Charge' },
  { name: 'Ghatkopar Station Road Charger', area: 'Ghatkopar', city: 'Mumbai', state: 'Maharashtra', lat: 19.0863, lng: 72.9081, operator: 'ChargeZone' },
  { name: 'Borivali National Park Charger', area: 'Borivali', city: 'Mumbai', state: 'Maharashtra', lat: 19.2307, lng: 72.8567, operator: 'Statiq' },
  { name: 'Malad Link Road Station', area: 'Malad', city: 'Mumbai', state: 'Maharashtra', lat: 19.1860, lng: 72.8489, operator: 'Ather Grid' },
  { name: 'Thane Viviana Mall Charger', area: 'Thane', city: 'Thane', state: 'Maharashtra', lat: 19.2062, lng: 72.9750, operator: 'ChargeZone' },
  { name: 'Vashi Sector 17 Charging Hub', area: 'Vashi', city: 'Navi Mumbai', state: 'Maharashtra', lat: 19.0754, lng: 73.0004, operator: 'Tata Power EZ Charge' },
  { name: 'Kharghar Central Park Charger', area: 'Kharghar', city: 'Navi Mumbai', state: 'Maharashtra', lat: 19.0474, lng: 73.0663, operator: 'Statiq' },
  { name: 'Panvel Highway Fast Charge', area: 'Panvel', city: 'Navi Mumbai', state: 'Maharashtra', lat: 18.9894, lng: 73.1175, operator: 'ChargeZone' },
  { name: 'Kalyan Station Road Charger', area: 'Kalyan', city: 'Kalyan-Dombivli', state: 'Maharashtra', lat: 19.2350, lng: 73.1305, operator: 'Ather Grid' },
  { name: 'Mira Road Charging Point', area: 'Mira Road', city: 'Mira-Bhayandar', state: 'Maharashtra', lat: 19.2952, lng: 72.8544, operator: 'Statiq' },

  // ---- Rest of Maharashtra ----
  { name: 'Pune Koregaon Park Hub', area: 'Koregaon Park', city: 'Pune', state: 'Maharashtra', lat: 18.5362, lng: 73.8940, operator: 'Tata Power EZ Charge' },
  { name: 'Pune Hinjewadi IT Park Charger', area: 'Hinjewadi', city: 'Pune', state: 'Maharashtra', lat: 18.5912, lng: 73.7389, operator: 'Statiq' },
  { name: 'Nashik College Road Charger', area: 'College Road', city: 'Nashik', state: 'Maharashtra', lat: 20.0059, lng: 73.7799, operator: 'ChargeZone' },
  { name: 'Nagpur Civil Lines Charging Hub', area: 'Civil Lines', city: 'Nagpur', state: 'Maharashtra', lat: 21.1520, lng: 79.0850, operator: 'Tata Power EZ Charge' },

  // ---- Delhi NCR ----
  { name: 'Connaught Place Charging Hub', area: 'Connaught Place', city: 'New Delhi', state: 'Delhi', lat: 28.6315, lng: 77.2167, operator: 'Tata Power EZ Charge' },
  { name: 'Dwarka Sector 21 Charger', area: 'Dwarka', city: 'New Delhi', state: 'Delhi', lat: 28.5921, lng: 77.0460, operator: 'Statiq' },
  { name: 'Cyber Hub Charging Bay', area: 'DLF Cyber City', city: 'Gurugram', state: 'Haryana', lat: 28.4950, lng: 77.0890, operator: 'ChargeZone' },
  { name: 'Noida Sector 18 Fast Charge', area: 'Sector 18', city: 'Noida', state: 'Uttar Pradesh', lat: 28.5697, lng: 77.3260, operator: 'Ather Grid' },

  // ---- Karnataka ----
  { name: 'Whitefield Charge Point', area: 'Whitefield', city: 'Bengaluru', state: 'Karnataka', lat: 12.9698, lng: 77.7500, operator: 'Ather Grid' },
  { name: 'Koramangala Charging Hub', area: 'Koramangala', city: 'Bengaluru', state: 'Karnataka', lat: 12.9352, lng: 77.6245, operator: 'ChargeZone' },
  { name: 'Electronic City Fast Charge', area: 'Electronic City', city: 'Bengaluru', state: 'Karnataka', lat: 12.8399, lng: 77.6770, operator: 'Statiq' },

  // ---- Tamil Nadu ----
  { name: 'OMR Fast Charge Hub', area: 'OMR', city: 'Chennai', state: 'Tamil Nadu', lat: 12.9010, lng: 80.2279, operator: 'Statiq' },
  { name: 'T. Nagar Charging Point', area: 'T. Nagar', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0418, lng: 80.2341, operator: 'Tata Power EZ Charge' },
  { name: 'Coimbatore RS Puram Charger', area: 'RS Puram', city: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0018, lng: 76.9528, operator: 'ChargeZone' },

  // ---- West Bengal ----
  { name: 'Salt Lake Charging Bay', area: 'Salt Lake', city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.4172, operator: 'Tata Power EZ Charge' },
  { name: 'Park Street Fast Charge', area: 'Park Street', city: 'Kolkata', state: 'West Bengal', lat: 22.5535, lng: 88.3521, operator: 'ChargeZone' },

  // ---- Telangana ----
  { name: 'HITEC City Charger', area: 'HITEC City', city: 'Hyderabad', state: 'Telangana', lat: 17.4483, lng: 78.3915, operator: 'Statiq' },
  { name: 'Banjara Hills Charging Point', area: 'Banjara Hills', city: 'Hyderabad', state: 'Telangana', lat: 17.4126, lng: 78.4482, operator: 'Ather Grid' },

  // ---- Gujarat ----
  { name: 'SG Highway Fast Charge', area: 'SG Highway', city: 'Ahmedabad', state: 'Gujarat', lat: 23.0339, lng: 72.5079, operator: 'ChargeZone' },
  { name: 'Surat Vesu Charging Hub', area: 'Vesu', city: 'Surat', state: 'Gujarat', lat: 21.1500, lng: 72.7700, operator: 'Statiq' },

  // ---- Rajasthan ----
  { name: 'C-Scheme Charging Point', area: 'C-Scheme', city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, operator: 'Tata Power EZ Charge' },

  // ---- Other state capitals / major cities ----
  { name: 'Chandigarh Sector 17 Charger', area: 'Sector 17', city: 'Chandigarh', state: 'Chandigarh', lat: 30.7410, lng: 76.7822, operator: 'Statiq' },
  { name: 'Hazratganj Charging Hub', area: 'Hazratganj', city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8500, lng: 80.9460, operator: 'ChargeZone' },
  { name: 'Indore Vijay Nagar Charger', area: 'Vijay Nagar', city: 'Indore', state: 'Madhya Pradesh', lat: 22.7530, lng: 75.8930, operator: 'Tata Power EZ Charge' },
  { name: 'Bhopal MP Nagar Fast Charge', area: 'MP Nagar', city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2350, lng: 77.4350, operator: 'Statiq' },
  { name: 'Kochi Marine Drive Charger', area: 'Marine Drive', city: 'Kochi', state: 'Kerala', lat: 9.9658, lng: 76.2740, operator: 'Ather Grid' },
  { name: 'Patna Boring Road Charging Point', area: 'Boring Road', city: 'Patna', state: 'Bihar', lat: 25.6100, lng: 85.1200, operator: 'ChargeZone' },
];

const CONNECTORS: Array<{ connectorType: string; chargingType: 'AC' | 'DC'; powerKW: number }> = [
  { connectorType: 'CCS2', chargingType: 'DC', powerKW: 50 },
  { connectorType: 'CHAdeMO', chargingType: 'DC', powerKW: 50 },
  { connectorType: 'Type2', chargingType: 'AC', powerKW: 22 },
  { connectorType: 'Bharat AC001', chargingType: 'AC', powerKW: 3.3 },
  { connectorType: 'Bharat DC001', chargingType: 'DC', powerKW: 15 },
];

const AMENITIES_POOL = ['Restroom', 'Cafe', 'WiFi', 'Parking', 'Waiting Lounge', 'CCTV', 'Convenience Store'];

function pick<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min: number, max: number, decimals = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

async function seed() {
  await mongoose.connect(env.mongoUri);
  console.log('[seed] connected to', env.mongoUri);

  console.log('[seed] clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Vehicle.deleteMany({}),
    ChargingStation.deleteMany({}),
    Charger.deleteMany({}),
    Booking.deleteMany({}),
    ChargingSession.deleteMany({}),
    Payment.deleteMany({}),
    Reward.deleteMany({}),
  ]);

  console.log('[seed] creating users...');
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const admin = await User.create({
    name: 'EVSync Admin',
    email: 'admin@evsync.demo',
    phone: '9876500000',
    passwordHash,
    role: 'ADMIN',
    verified: true,
  });
  const demoUser = await User.create({
    name: 'Rohan Mehta',
    email: 'user@evsync.demo',
    phone: '9876500001',
    passwordHash,
    role: 'USER',
    verified: true,
    greenPoints: 120,
  });
  await User.create({
    name: 'Ananya Sharma',
    email: 'ananya@evsync.demo',
    phone: '9876500002',
    passwordHash,
    role: 'USER',
    verified: true,
  });

  console.log('[seed] creating vehicle...');
  const vehicle = await Vehicle.create({
    userId: demoUser._id,
    manufacturer: 'Tata',
    model: 'Nexon EV',
    batteryCapacityKWh: 40.5,
    currentBatteryPercentage: 34,
    connectorType: 'CCS2',
    registrationNumber: 'MH02AB1234',
    chargingSpeedKW: 50,
    efficiencyKmPerKWh: 6.5,
  });

  console.log('[seed] creating stations and chargers...');
  const stationDocs: InstanceType<typeof ChargingStation>[] = [];
  for (const s of STATIONS) {
    const station = await ChargingStation.create({
      name: s.name,
      operator: s.operator,
      address: `${s.area}, ${s.city}, ${s.state}`,
      city: s.city,
      state: s.state,
      pincode: `${randInt(100000, 855999)}`,
      latitude: s.lat,
      longitude: s.lng,
      openingHours: '24/7',
      amenities: pick(AMENITIES_POOL, randInt(2, 4)),
      renewableEnergy: Math.random() > 0.5,
      rating: randFloat(3.5, 5.0),
      pricePerKWh: randFloat(9, 18),
      parkingFee: randInt(0, 30),
      status: 'ACTIVE',
      images: [],
    });
    stationDocs.push(station);

    const chargerCount = randInt(2, 5);
    for (let i = 0; i < chargerCount; i++) {
      const conn = CONNECTORS[randInt(0, CONNECTORS.length - 1)];
      await Charger.create({
        stationId: station._id,
        chargerCode: `${station._id.toString().slice(-5).toUpperCase()}-C${i + 1}`,
        connectorType: conn.connectorType,
        powerKW: conn.powerKW,
        chargingType: conn.chargingType,
        status: Math.random() > 0.25 ? 'AVAILABLE' : 'CHARGING',
        lastHeartbeat: new Date(),
        ocppStatus: 'Available',
      });
    }
    await recalculateAvailability(station._id.toString());
  }

  console.log('[seed] creating a sample historical booking + session + payment...');
  const firstStation = stationDocs[0];
  const firstCharger = await Charger.findOne({ stationId: firstStation._id });
  if (firstCharger) {
    const past = new Date(Date.now() - 2 * 86400000);
    const booking = await Booking.create({
      userId: demoUser._id,
      stationId: firstStation._id,
      chargerId: firstCharger._id,
      vehicleId: vehicle._id,
      startTime: past,
      endTime: new Date(past.getTime() + 30 * 60000),
      durationMinutes: 30,
      status: 'COMPLETED',
      qrToken: 'seed-demo-completed-booking',
      paymentStatus: 'PAID',
    });
    const session = await ChargingSession.create({
      bookingId: booking._id,
      userId: demoUser._id,
      chargerId: firstCharger._id,
      startedAt: past,
      endedAt: new Date(past.getTime() + 28 * 60000),
      initialBatteryPercentage: 20,
      finalBatteryPercentage: 68,
      energyConsumedKWh: 19.4,
      chargingPowerKW: firstCharger.powerKW,
      cost: 232.8,
      status: 'COMPLETED',
      meterValues: [],
    });
    await Payment.create({
      bookingId: booking._id,
      userId: demoUser._id,
      amount: 252.8,
      currency: 'INR',
      paymentMethod: 'SIMULATED_WALLET',
      transactionId: 'SIM-seed-demo-txn-001',
      status: 'SUCCESS',
      breakdown: { energyCost: 232.8, parkingFee: 10, bookingFee: 10 },
      paidAt: session.endedAt,
    });
    await Reward.create({
      userId: demoUser._id,
      points: 39,
      reason: 'Charging session completed',
      transactionType: 'EARNED',
    });
  }

  console.log('[seed] done.');
  console.log('[seed] ----------------------------------------------------');
  console.log('[seed] Demo credentials (see README.md):');
  console.log('[seed]   Admin: admin@evsync.demo / Password123!');
  console.log('[seed]   User:  user@evsync.demo  / Password123!');
  console.log('[seed] ----------------------------------------------------');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
