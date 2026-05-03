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
 * P8: Duplicate Detection Consistency
 * Validates: Requirement 35
 *
 * A duplicate warning is shown when a file with the same name and size within 5% exists.
 */
(0, vitest_1.describe)('P8: Duplicate Detection Consistency', () => {
    function isDuplicate(existingName, existingSize, newName, newSize) {
        if (existingName !== newName)
            return false;
        const sizeMin = Math.floor(existingSize * 0.95);
        const sizeMax = Math.ceil(existingSize * 1.05);
        return newSize >= sizeMin && newSize <= sizeMax;
    }
    (0, vitest_1.it)('detects duplicates with same name and size within 5%', () => {
        fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 50 }), fc.integer({ min: 1000, max: 10000000 }), fc.double({ min: 0.95, max: 1.05, noNaN: true }), (name, size, factor) => {
            const newSize = Math.round(size * factor);
            (0, vitest_1.expect)(isDuplicate(name, size, name, newSize)).toBe(true);
        }));
    });
    (0, vitest_1.it)('does not flag duplicates with different names', () => {
        fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 50 }), fc.string({ minLength: 1, maxLength: 50 }), fc.integer({ min: 1000, max: 10000000 }), (name1, name2, size) => {
            fc.pre(name1 !== name2);
            (0, vitest_1.expect)(isDuplicate(name1, size, name2, size)).toBe(false);
        }));
    });
    (0, vitest_1.it)('does not flag duplicates when size differs by more than 5%', () => {
        fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 50 }), fc.integer({ min: 10000, max: 10000000 }), fc.double({ min: 1.06, max: 2.0, noNaN: true }), (name, size, factor) => {
            const newSize = Math.round(size * factor);
            (0, vitest_1.expect)(isDuplicate(name, size, name, newSize)).toBe(false);
        }));
    });
});
//# sourceMappingURL=duplicateDetection.property.test.js.map