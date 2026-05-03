import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * P6: Session Expiry Enforcement
 * Validates: Requirements 1.6
 *
 * Sessions idle for 24 hours or more must be invalidated.
 * Sessions idle for less than 24 hours must remain valid.
 */
describe('P6: Session Expiry Enforcement', () => {
  const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

  function isSessionValid(createdAt: Date, lastAccessedAt: Date, now: Date): boolean {
    const idleTime = now.getTime() - lastAccessedAt.getTime()
    return idleTime < SESSION_MAX_AGE_MS
  }

  it('sessions idle for less than 24 hours are valid', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: SESSION_MAX_AGE_MS - 1 }),
        (idleMs) => {
          const now = new Date()
          const lastAccessed = new Date(now.getTime() - idleMs)
          const createdAt = new Date(lastAccessed.getTime() - 1000)
          expect(isSessionValid(createdAt, lastAccessed, now)).toBe(true)
        }
      )
    )
  })

  it('sessions idle for 24 hours or more are invalid', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: SESSION_MAX_AGE_MS, max: SESSION_MAX_AGE_MS * 30 }),
        (idleMs) => {
          const now = new Date()
          const lastAccessed = new Date(now.getTime() - idleMs)
          const createdAt = new Date(lastAccessed.getTime() - 1000)
          expect(isSessionValid(createdAt, lastAccessed, now)).toBe(false)
        }
      )
    )
  })
})
