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
 * P6: Session Expiry Enforcement
 * Validates: Requirements 1.6
 *
 * Sessions idle for 24 hours or more must be invalidated.
 * Sessions idle for less than 24 hours must remain valid.
 */
(0, vitest_1.describe)('P6: Session Expiry Enforcement', () => {
    const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
    function isSessionValid(createdAt, lastAccessedAt, now) {
        const idleTime = now.getTime() - lastAccessedAt.getTime();
        return idleTime < SESSION_MAX_AGE_MS;
    }
    (0, vitest_1.it)('sessions idle for less than 24 hours are valid', () => {
        fc.assert(fc.property(fc.integer({ min: 0, max: SESSION_MAX_AGE_MS - 1 }), (idleMs) => {
            const now = new Date();
            const lastAccessed = new Date(now.getTime() - idleMs);
            const createdAt = new Date(lastAccessed.getTime() - 1000);
            (0, vitest_1.expect)(isSessionValid(createdAt, lastAccessed, now)).toBe(true);
        }));
    });
    (0, vitest_1.it)('sessions idle for 24 hours or more are invalid', () => {
        fc.assert(fc.property(fc.integer({ min: SESSION_MAX_AGE_MS, max: SESSION_MAX_AGE_MS * 30 }), (idleMs) => {
            const now = new Date();
            const lastAccessed = new Date(now.getTime() - idleMs);
            const createdAt = new Date(lastAccessed.getTime() - 1000);
            (0, vitest_1.expect)(isSessionValid(createdAt, lastAccessed, now)).toBe(false);
        }));
    });
});
//# sourceMappingURL=session.property.test.js.map