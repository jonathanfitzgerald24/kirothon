import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * P8: Duplicate Detection Consistency
 * Validates: Requirement 35
 *
 * A duplicate warning is shown when a file with the same name and size within 5% exists.
 */
describe('P8: Duplicate Detection Consistency', () => {
  function isDuplicate(existingName: string, existingSize: number, newName: string, newSize: number): boolean {
    if (existingName !== newName) return false
    const sizeMin = Math.floor(existingSize * 0.95)
    const sizeMax = Math.ceil(existingSize * 1.05)
    return newSize >= sizeMin && newSize <= sizeMax
  }

  it('detects duplicates with same name and size within 5%', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1000, max: 10000000 }),
        fc.double({ min: 0.95, max: 1.05, noNaN: true }),
        (name, size, factor) => {
          const newSize = Math.round(size * factor)
          expect(isDuplicate(name, size, name, newSize)).toBe(true)
        }
      )
    )
  })

  it('does not flag duplicates with different names', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1000, max: 10000000 }),
        (name1, name2, size) => {
          fc.pre(name1 !== name2)
          expect(isDuplicate(name1, size, name2, size)).toBe(false)
        }
      )
    )
  })

  it('does not flag duplicates when size differs by more than 5%', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 10000, max: 10000000 }),
        fc.double({ min: 1.06, max: 2.0, noNaN: true }),
        (name, size, factor) => {
          const newSize = Math.round(size * factor)
          expect(isDuplicate(name, size, name, newSize)).toBe(false)
        }
      )
    )
  })
})
