import { describe, expect, it } from 'vitest'
import { localDateKey } from './date'

describe('localDateKey', () => {
  it('formats a local calendar date without UTC conversion', () => {
    expect(localDateKey(new Date(2026, 7, 18, 23, 30))).toBe('2026-08-18')
  })
})
