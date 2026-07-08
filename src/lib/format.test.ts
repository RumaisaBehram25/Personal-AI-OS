import { describe, it, expect } from 'vitest'
import { formatMoney } from './format'

describe('formatMoney', () => {
  it('formats USD amounts', () => {
    expect(formatMoney(42, 'USD')).toBe('$42.00')
  })

  it('defaults to USD', () => {
    expect(formatMoney(15.5)).toBe('$15.50')
  })

  it('falls back gracefully for invalid currency codes', () => {
    expect(formatMoney(10, 'NOT_A_CURRENCY')).toBe('NOT_A_CURRENCY 10.00')
  })
})
