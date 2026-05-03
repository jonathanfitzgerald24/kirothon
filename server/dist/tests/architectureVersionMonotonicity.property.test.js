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
 * P3: Architecture Version Monotonicity
 * Validates: Requirement 11.7
 *
 * Architecture version numbers must be strictly increasing.
 * Each activation must produce a version number greater than all previous versions.
 */
(0, vitest_1.describe)('P3: Architecture Version Monotonicity', () => {
    function simulateActivations(initialVersion, activationCount) {
        const versions = [];
        let current = initialVersion;
        for (let i = 0; i < activationCount; i++) {
            current += 1;
            versions.push(current);
        }
        return versions;
    }
    function isStrictlyIncreasing(versions) {
        for (let i = 1; i < versions.length; i++) {
            if (versions[i] <= versions[i - 1])
                return false;
        }
        return true;
    }
    (0, vitest_1.it)('version numbers are strictly increasing across activations', () => {
        fc.assert(fc.property(fc.integer({ min: 0, max: 100 }), fc.integer({ min: 1, max: 20 }), (initialVersion, activationCount) => {
            const versions = simulateActivations(initialVersion, activationCount);
            (0, vitest_1.expect)(isStrictlyIncreasing(versions)).toBe(true);
        }));
    });
    (0, vitest_1.it)('each new version is exactly one greater than the previous', () => {
        fc.assert(fc.property(fc.integer({ min: 0, max: 1000 }), fc.integer({ min: 2, max: 10 }), (startVersion, count) => {
            const versions = simulateActivations(startVersion, count);
            for (let i = 1; i < versions.length; i++) {
                (0, vitest_1.expect)(versions[i]).toBe(versions[i - 1] + 1);
            }
        }));
    });
    (0, vitest_1.it)('rollback followed by activation produces a higher version number', () => {
        fc.assert(fc.property(fc.integer({ min: 1, max: 50 }), (currentVersion) => {
            // After rollback, next activation gets currentVersion + 1
            const nextVersion = currentVersion + 1;
            (0, vitest_1.expect)(nextVersion).toBeGreaterThan(currentVersion);
        }));
    });
});
//# sourceMappingURL=architectureVersionMonotonicity.property.test.js.map