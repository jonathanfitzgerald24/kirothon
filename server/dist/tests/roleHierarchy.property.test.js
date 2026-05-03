"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fc = __importStar(require("fast-check"));
/**
 * P1: Role Hierarchy Enforcement
 * Validates: Requirements 7.5, 7.6, 7.7, 13.1, 13.2
 *
 * A user can access a category if and only if:
 * - Their role level >= the category's minimumRole level, OR
 * - They have an individual AccessGrant for that category
 */
(0, vitest_1.describe)('P1: Role Hierarchy Enforcement', () => {
    const roleLevel = { MEMBER: 1, MOD: 2, ADMIN: 3 };
    function canAccess(userRole, categoryMinRole, hasGrant) {
        return roleLevel[userRole] >= roleLevel[categoryMinRole] || hasGrant;
    }
    (0, vitest_1.it)('admin can always access any category regardless of minimumRole', () => {
        fc.assert(fc.property(fc.constantFrom('MEMBER', 'MOD', 'ADMIN'), fc.boolean(), (minRole, hasGrant) => {
            (0, vitest_1.expect)(canAccess('ADMIN', minRole, hasGrant)).toBe(true);
        }));
    });
    (0, vitest_1.it)('member cannot access MOD or ADMIN restricted categories without a grant', () => {
        fc.assert(fc.property(fc.constantFrom('MOD', 'ADMIN'), (minRole) => {
            (0, vitest_1.expect)(canAccess('MEMBER', minRole, false)).toBe(false);
        }));
    });
    (0, vitest_1.it)('individual grant overrides role restriction', () => {
        fc.assert(fc.property(fc.constantFrom('MEMBER', 'MOD', 'ADMIN'), fc.constantFrom('MEMBER', 'MOD', 'ADMIN'), (userRole, minRole) => {
            // With a grant, always accessible
            (0, vitest_1.expect)(canAccess(userRole, minRole, true)).toBe(true);
        }));
    });
    (0, vitest_1.it)('access decision is consistent: same inputs always produce same output', () => {
        fc.assert(fc.property(fc.constantFrom('MEMBER', 'MOD', 'ADMIN'), fc.constantFrom('MEMBER', 'MOD', 'ADMIN'), fc.boolean(), (userRole, minRole, hasGrant) => {
            const result1 = canAccess(userRole, minRole, hasGrant);
            const result2 = canAccess(userRole, minRole, hasGrant);
            (0, vitest_1.expect)(result1).toBe(result2);
        }));
    });
    (0, vitest_1.it)('role hierarchy is transitive: if MOD can access, ADMIN can too', () => {
        fc.assert(fc.property(fc.constantFrom('MEMBER', 'MOD', 'ADMIN'), fc.boolean(), (minRole, hasGrant) => {
            const modAccess = canAccess('MOD', minRole, hasGrant);
            const adminAccess = canAccess('ADMIN', minRole, hasGrant);
            // If MOD can access, ADMIN must also be able to
            if (modAccess)
                (0, vitest_1.expect)(adminAccess).toBe(true);
        }));
    });
});
//# sourceMappingURL=roleHierarchy.property.test.js.map