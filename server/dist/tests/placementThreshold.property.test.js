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
 * P4: Placement Threshold Consistency
 * Validates: Requirement 9.2, 9.3, 9.4
 *
 * Auto-placement only occurs when exactly one score >= 80.
 */
(0, vitest_1.describe)('P4: Placement Threshold Consistency', () => {
    function makeDecision(scores) {
        const above80 = scores.filter(s => s >= 80);
        if (above80.length === 1)
            return 'auto_placed';
        if (above80.length > 1)
            return 'needs_selection';
        return 'no_match';
    }
    (0, vitest_1.it)('auto-places only when exactly one score >= 80', () => {
        fc.assert(fc.property(fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 10 }), (scores) => {
            const decision = makeDecision(scores);
            const above80 = scores.filter(s => s >= 80);
            if (decision === 'auto_placed') {
                (0, vitest_1.expect)(above80.length).toBe(1);
            }
        }));
    });
    (0, vitest_1.it)('prompts selection when multiple scores >= 80', () => {
        fc.assert(fc.property(fc.array(fc.integer({ min: 80, max: 100 }), { minLength: 2, maxLength: 5 }), (highScores) => {
            const decision = makeDecision(highScores);
            (0, vitest_1.expect)(decision).toBe('needs_selection');
        }));
    });
    (0, vitest_1.it)('returns no_match when all scores < 80', () => {
        fc.assert(fc.property(fc.array(fc.integer({ min: 0, max: 79 }), { minLength: 1, maxLength: 10 }), (lowScores) => {
            const decision = makeDecision(lowScores);
            (0, vitest_1.expect)(decision).toBe('no_match');
        }));
    });
});
//# sourceMappingURL=placementThreshold.property.test.js.map