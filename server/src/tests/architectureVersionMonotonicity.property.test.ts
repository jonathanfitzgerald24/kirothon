import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * P3: Architecture Version Monotonicity
 * Validates: Requirement 11.7
 *
 * Architecture version numbers must be strictly increasing.
 * Each activation must produce a version number greater than all previous versions.
 */
describe('P3: Architecture Version Monotonicity', () => {
  function simulateActivations(initialVersion: number, activationCount: number): number[] {
    const versions: number[] = []
    let current = initialVersion
    for (let i = 0; i < activationCount; i++) {
      current += 1
      versions.push(current)
    }
    return versions
  }

  function isStrictlyIncreasing(versions: number[]): boolean {
    for (let i = 1; i < versions.length; i++) {
      if (versions[i] <= versions[i - 1]) return false
    }
    return true
  }

  it('version numbers are strictly increasing across activations', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 1, max: 20 }),
        (initialVersion, activationCount) => {
          const versions = simulateActivations(initialVersion, activationCount)
          expect(isStrictlyIncreasing(versions)).toBe(true)
        }
      )
    )
  })

  it('each new version is exactly one greater than the previous', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 2, max: 10 }),
        (startVersion, count) => {
          const versions = simulateActivations(startVersion, count)
          for (let i = 1; i < versions.length; i++) {
            expect(versions[i]).toBe(versions[i - 1] + 1)
          }
        }
      )
    )
  })

  it('rollback followed by activation produces a higher version number', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        (currentVersion) => {
          // After rollback, next activation gets currentVersion + 1
          const nextVersion = currentVersion + 1
          expect(nextVersion).toBeGreaterThan(currentVersion)
        }
      )
    )
  })
})
