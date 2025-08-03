import { describe, it, expect } from 'vitest';
import { computeAverageRating } from './utils';

describe('computeAverageRating', () => {
  it('returns 0 for empty array', () => {
    expect(computeAverageRating([])).toBe(0);
  });

  it('calculates average to one decimal', () => {
    const reviews = [{ rating: 4 }, { rating: 5 }];
    expect(computeAverageRating(reviews)).toBe(4.5);
  });
});
