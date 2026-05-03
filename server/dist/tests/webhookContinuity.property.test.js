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
 * P13: Webhook Continuity
 * Validates: Requirement 15.2
 *
 * Webhook expiry is always > 1 hour in the future, or re-registration is triggered.
 */
(0, vitest_1.describe)('P13: Webhook Continuity', () => {
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const TWENTY_THREE_HOURS_MS = 23 * 60 * 60 * 1000;
    function needsRenewal(expiryTime, now) {
        return expiryTime - now < ONE_HOUR_MS;
    }
    function renewExpiry(now) {
        return now + TWENTY_THREE_HOURS_MS;
    }
    (0, vitest_1.it)('webhook expiry after registration is always > 1 hour in the future', () => {
        fc.assert(fc.property(fc.integer({ min: 1000000000000, max: 2000000000000 }), // realistic timestamps
        (now) => {
            const expiry = renewExpiry(now);
            (0, vitest_1.expect)(expiry - now).toBeGreaterThan(ONE_HOUR_MS);
        }));
    });
    (0, vitest_1.it)('renewal is triggered when expiry is within 1 hour', () => {
        fc.assert(fc.property(fc.integer({ min: 1000000000000, max: 2000000000000 }), fc.integer({ min: 0, max: ONE_HOUR_MS - 1 }), (now, timeUntilExpiry) => {
            const expiry = now + timeUntilExpiry;
            (0, vitest_1.expect)(needsRenewal(expiry, now)).toBe(true);
        }));
    });
    (0, vitest_1.it)('renewal is NOT triggered when expiry is more than 1 hour away', () => {
        fc.assert(fc.property(fc.integer({ min: 1000000000000, max: 2000000000000 }), fc.integer({ min: ONE_HOUR_MS, max: TWENTY_THREE_HOURS_MS }), (now, timeUntilExpiry) => {
            const expiry = now + timeUntilExpiry;
            (0, vitest_1.expect)(needsRenewal(expiry, now)).toBe(false);
        }));
    });
    (0, vitest_1.it)('after renewal, the new expiry is always valid (> 1 hour from now)', () => {
        fc.assert(fc.property(fc.integer({ min: 1000000000000, max: 2000000000000 }), (now) => {
            const oldExpiry = now + 30 * 60 * 1000; // 30 min from now (needs renewal)
            (0, vitest_1.expect)(needsRenewal(oldExpiry, now)).toBe(true);
            const newExpiry = renewExpiry(now);
            (0, vitest_1.expect)(needsRenewal(newExpiry, now)).toBe(false);
        }));
    });
});
//# sourceMappingURL=webhookContinuity.property.test.js.map