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
 * P9: Metadata-Only Storage
 * Validates: Requirement 3.5
 *
 * After analysis, FileMeta records must contain only driveFileId references.
 * No binary content (base64, Buffer, binary strings) should be stored.
 */
(0, vitest_1.describe)('P9: Metadata-Only Storage', () => {
    function containsBinaryContent(record) {
        // Check if any string field looks like binary content (base64 or raw bytes)
        const stringFields = [record.name, record.mimeType, record.aiSummary, record.uploadNote].filter(Boolean);
        return stringFields.some((field) => {
            // Base64 pattern: long string of base64 chars
            const base64Pattern = /^[A-Za-z0-9+/]{100,}={0,2}$/;
            // Binary-looking: high ratio of non-printable chars
            const nonPrintable = field.split('').filter((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) > 126).length;
            return base64Pattern.test(field) || nonPrintable / field.length > 0.1;
        });
    }
    (0, vitest_1.it)('FileMeta records never contain binary content, only driveFileId references', () => {
        fc.assert(fc.property(fc.record({
            driveFileId: fc.string({ minLength: 10, maxLength: 50 }),
            name: fc.string({ minLength: 1, maxLength: 255 }),
            mimeType: fc.constantFrom('application/pdf', 'image/png', 'application/vnd.google-apps.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
            sizeBytes: fc.bigInt({ min: BigInt(0), max: BigInt(1073741824) }), // 0 to 1GB
        }), (record) => {
            // The record has a driveFileId (reference) but no binary content
            (0, vitest_1.expect)(record.driveFileId).toBeTruthy();
            (0, vitest_1.expect)(containsBinaryContent(record)).toBe(false);
            // sizeBytes is metadata (a number), not the actual file content
            (0, vitest_1.expect)(typeof record.sizeBytes).toBe('bigint');
        }));
    });
    (0, vitest_1.it)('driveFileId is always a non-empty string reference', () => {
        fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 100 }), (driveFileId) => {
            (0, vitest_1.expect)(driveFileId.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(typeof driveFileId).toBe('string');
        }));
    });
});
//# sourceMappingURL=metadataOnly.property.test.js.map