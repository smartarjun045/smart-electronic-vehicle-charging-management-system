import { DEFAULT_WEIGHTS } from '../services/recommendationService';

describe('recommendation engine weights', () => {
  it('sums to 1.0 (transparent, fully-accounted scoring)', () => {
    const total = Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });
});
