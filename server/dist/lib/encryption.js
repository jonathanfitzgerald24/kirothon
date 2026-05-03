"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
function getKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key)
        throw new Error('ENCRYPTION_KEY environment variable is not set');
    const keyBuffer = Buffer.from(key, 'hex');
    if (keyBuffer.length !== 32)
        throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    return keyBuffer;
}
function encrypt(plaintext) {
    const key = getKey();
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    // Format: iv:tag:encrypted (all hex)
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}
function decrypt(ciphertext) {
    const key = getKey();
    const parts = ciphertext.split(':');
    if (parts.length !== 3)
        throw new Error('Invalid ciphertext format');
    const [ivHex, tagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}
//# sourceMappingURL=encryption.js.map