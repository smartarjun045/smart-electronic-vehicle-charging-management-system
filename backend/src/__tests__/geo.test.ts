import { haversineDistanceKm } from '../utils/geo';

describe('haversineDistanceKm', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineDistanceKm(19.0760, 72.8777, 19.0760, 72.8777)).toBeCloseTo(0, 5);
  });

  it('computes a realistic distance between two Mumbai landmarks (Bandra to Colaba, ~16km)', () => {
    const d = haversineDistanceKm(19.0596, 72.8295, 18.9152, 72.8258);
    expect(d).toBeGreaterThan(14);
    expect(d).toBeLessThan(18);
  });
});
