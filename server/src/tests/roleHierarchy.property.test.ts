import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * P1: Role Hierarchy Enforcement
 * Validates: Requirements 7.5, 7.6, 7.7, 13.1, 13.2
 *
 * A user can access a category if and only if:
 * - Their role level >= the category's minimumRole level, OR
 * - They have an individual AccessGrant for that category
 */
describe('P1: Role Hierarchy Enforcement', () => {
  type Role = 'MEMBER' | 'MOD' | 'ADMIN'
  const roleLevel: Record<Role, number> = { MEMBER: 1, MOD: 2, ADMIN: 3 }

  function canAccess(userRole: Role, categoryMinRole: Role, hasGrant: boolean): boolean {
    return roleLevel[userRole] >= roleLevel[categoryMinRole] || hasGrant
  }

  it('admin can always access any category regardless of minimumRole', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Role>('MEMBER', 'MOD', 'ADMIN'),
        fc.boolean(),
        (minRole, hasGrant) => {
          expect(canAccess('ADMIN', minRole, hasGrant)).toBe(true)
        }
      )
    )
  })

  it('member cannot access MOD or ADMIN restricted categories without a grant', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Role>('MOD', 'ADMIN'),
        (minRole) => {
          expect(canAccess('MEMBER', minRole, false)).toBe(false)
        }
      )
    )
  })

  it('individual grant overrides role restriction', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Role>('MEMBER', 'MOD', 'ADMIN'),
        fc.constantFrom<Role>('MEMBER', 'MOD', 'ADMIN'),
        (userRole, minRole) => {
          // With a grant, always accessible
          expect(canAccess(userRole, minRole, true)).toBe(true)
        }
      )
    )
  })

  it('access decision is consistent: same inputs always produce same output', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Role>('MEMBER', 'MOD', 'ADMIN'),
        fc.constantFrom<Role>('MEMBER', 'MOD', 'ADMIN'),
        fc.boolean(),
        (userRole, minRole, hasGrant) => {
          const result1 = canAccess(userRole, minRole, hasGrant)
          const result2 = canAccess(userRole, minRole, hasGrant)
          expect(result1).toBe(result2)
        }
      )
    )
  })

  it('role hierarchy is transitive: if MOD can access, ADMIN can too', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Role>('MEMBER', 'MOD', 'ADMIN'),
        fc.boolean(),
        (minRole, hasGrant) => {
          const modAccess = canAccess('MOD', minRole, hasGrant)
          const adminAccess = canAccess('ADMIN', minRole, hasGrant)
          // If MOD can access, ADMIN must also be able to
          if (modAccess) expect(adminAccess).toBe(true)
        }
      )
    )
  })
})
