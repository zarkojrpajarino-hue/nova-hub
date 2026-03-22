import { describe, it, expect } from 'vitest'
import {
  hasSignificantValueChange,
  extractSignalValue,
  VALUE_CHANGE_THRESHOLD,
} from '../agent-antispam'

describe('hasSignificantValueChange', () => {
  it('returns false when both values are 0', () => {
    expect(hasSignificantValueChange(0, 0)).toBe(false)
  })

  it('returns true when previous is 0 and current is non-zero', () => {
    expect(hasSignificantValueChange(100, 0)).toBe(true)
  })

  it('returns true when current is 0 and previous is non-zero', () => {
    expect(hasSignificantValueChange(0, 100)).toBe(true)
  })

  it('returns true when change exceeds threshold (positive)', () => {
    // 500 → 600 = 20% change > 15%
    expect(hasSignificantValueChange(600, 500)).toBe(true)
  })

  it('returns true when change exceeds threshold (negative)', () => {
    // 500 → 400 = 20% change > 15%
    expect(hasSignificantValueChange(400, 500)).toBe(true)
  })

  it('returns false when change is below threshold', () => {
    // 500 → 505 = 1% change < 15%
    expect(hasSignificantValueChange(505, 500)).toBe(false)
  })

  it('returns true when change equals threshold exactly', () => {
    // 100 → 115 = 15% change = threshold
    expect(hasSignificantValueChange(115, 100)).toBe(true)
  })

  it('works with negative values', () => {
    // -100 → -120 = 20% change > 15%
    expect(hasSignificantValueChange(-120, -100)).toBe(true)
  })

  it('respects custom threshold', () => {
    // 500 → 550 = 10% change, threshold 5% → true
    expect(hasSignificantValueChange(550, 500, 0.05)).toBe(true)
    // 500 → 550 = 10% change, threshold 20% → false
    expect(hasSignificantValueChange(550, 500, 0.20)).toBe(false)
  })

  it('exports default threshold as 0.15', () => {
    expect(VALUE_CHANGE_THRESHOLD).toBe(0.15)
  })
})

describe('extractSignalValue', () => {
  it('extracts current_value from valid payload', () => {
    const payload = { signal: { metric_name: 'mrr', current_value: 500 } }
    expect(extractSignalValue(payload)).toBe(500)
  })

  it('returns null for null payload', () => {
    expect(extractSignalValue(null)).toBeNull()
  })

  it('returns null for undefined payload', () => {
    expect(extractSignalValue(undefined)).toBeNull()
  })

  it('returns null when payload has no signal', () => {
    expect(extractSignalValue({ content: 'foo' })).toBeNull()
  })

  it('returns null when signal has no current_value', () => {
    expect(extractSignalValue({ signal: { metric_name: 'mrr' } })).toBeNull()
  })

  it('returns null when current_value is not a number', () => {
    expect(extractSignalValue({ signal: { current_value: 'abc' } })).toBeNull()
  })

  it('returns 0 when current_value is 0', () => {
    expect(extractSignalValue({ signal: { current_value: 0 } })).toBe(0)
  })
})
