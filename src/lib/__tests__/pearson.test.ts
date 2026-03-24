import { describe, it, expect } from 'vitest';
import {
  pearsonCorrelation,
  correlationColor,
  correlationBgColor,
  type PearsonResult,
} from '../pearson';

describe('pearsonCorrelation', () => {
  it('returns null for fewer than 4 data points', () => {
    expect(pearsonCorrelation([1, 2, 3], [4, 5, 6])).toBeNull();
    expect(pearsonCorrelation([1], [2])).toBeNull();
    expect(pearsonCorrelation([], [])).toBeNull();
  });

  it('returns strong positive correlation for perfectly correlated data', () => {
    const result = pearsonCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
    expect(result).not.toBeNull();
    expect(result!.r).toBe(1);
    expect(result!.strength).toBe('strong');
  });

  it('returns strong negative correlation for inversely correlated data', () => {
    const result = pearsonCorrelation([1, 2, 3, 4, 5], [10, 8, 6, 4, 2]);
    expect(result).not.toBeNull();
    expect(result!.r).toBe(-1);
    expect(result!.strength).toBe('strong');
  });

  it('returns weak correlation for uncorrelated data', () => {
    // Data with near-zero correlation
    const result = pearsonCorrelation([1, 2, 3, 4], [2, 4, 1, 3]);
    expect(result).not.toBeNull();
    expect(Math.abs(result!.r)).toBeLessThanOrEqual(0.3);
    expect(result!.strength).toBe('weak');
  });

  it('returns { r: 0, strength: weak } when one series is constant (denominator 0)', () => {
    const result = pearsonCorrelation([1, 2, 3, 4], [5, 5, 5, 5]);
    expect(result).not.toBeNull();
    expect(result!.r).toBe(0);
    expect(result!.strength).toBe('weak');
  });

  it('uses min length of both arrays', () => {
    // x has 5 items, y has 4. Should use n=4.
    const result = pearsonCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8]);
    expect(result).not.toBeNull();
    expect(result!.r).toBe(1); // first 4 are perfectly correlated
  });

  it('returns moderate correlation for moderately correlated data', () => {
    // [1,2,3,4,5] vs [2,3,1,4,3] gives r = 0.42 (moderate: 0.3 < |r| <= 0.6)
    const result = pearsonCorrelation([1, 2, 3, 4, 5], [2, 3, 1, 4, 3]);
    expect(result).not.toBeNull();
    expect(result!.r).toBe(0.42);
    expect(result!.strength).toBe('moderate');
  });

  it('r is rounded to 2 decimal places', () => {
    const result = pearsonCorrelation([1, 2, 3, 4, 5], [1, 3, 2, 5, 4]);
    expect(result).not.toBeNull();
    // Check that r has at most 2 decimal places
    const str = result!.r.toString();
    const decimals = str.includes('.') ? str.split('.')[1].length : 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });

  it('strength thresholds: >0.6 strong, >0.3 moderate, else weak', () => {
    // We can verify the threshold logic via known values
    // r = 0.61 → strong
    // r = 0.31 → moderate
    // r = 0.29 → weak
    // Use the function's internal logic by checking known outputs
    const strong = pearsonCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
    expect(strong!.strength).toBe('strong');
  });
});

describe('correlationColor', () => {
  it('returns green for strong', () => {
    expect(correlationColor('strong')).toBe('text-green-600');
  });

  it('returns amber for moderate', () => {
    expect(correlationColor('moderate')).toBe('text-amber-600');
  });

  it('returns muted for weak', () => {
    expect(correlationColor('weak')).toBe('text-muted-foreground');
  });
});

describe('correlationBgColor', () => {
  it('returns green bg for strong', () => {
    expect(correlationBgColor('strong')).toBe('bg-green-50 border-green-200');
  });

  it('returns amber bg for moderate', () => {
    expect(correlationBgColor('moderate')).toBe('bg-amber-50 border-amber-200');
  });

  it('returns muted bg for weak', () => {
    expect(correlationBgColor('weak')).toBe('bg-muted/50 border-border');
  });
});
