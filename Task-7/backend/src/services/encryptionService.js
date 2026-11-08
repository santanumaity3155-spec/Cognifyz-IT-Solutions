import crypto from 'crypto';
import { env } from '../config/environment.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // 96-bit IV recommended by NIST SP 800-38D for AES-GCM
const AUTH_TAG_LENGTH_BYTES = 16; // 128-bit authentication tag

/**
 * Normalize and validate that the encryption key is exactly 32 bytes (256 bits).
 * Accepts 64-character hex strings or 32-byte Buffer/UTF-8 strings.
 * @param {string | Buffer} [candidateKey]
 * @returns {Buffer} 32-byte key buffer
 */
export const normalizeKey = (candidateKey) => {
  const keyToUse = candidateKey || env.GITHUB_TOKEN_ENCRYPTION_KEY;

  if (!keyToUse) {
    throw new Error('Encryption key is not defined. Set GITHUB_TOKEN_ENCRYPTION_KEY in environment.');
  }

  if (Buffer.isBuffer(keyToUse)) {
    if (keyToUse.length !== 32) {
      throw new Error(`Encryption key buffer must be exactly 32 bytes (received ${keyToUse.length} bytes).`);
    }
    return keyToUse;
  }

  if (typeof keyToUse === 'string') {
    const trimmed = keyToUse.trim();
    // Check if 64-character hex string
    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      return Buffer.from(trimmed, 'hex');
    }
    // Check if exactly 32-byte UTF-8 string
    const buf = Buffer.from(trimmed, 'utf-8');
    if (buf.length === 32) {
      return buf;
    }
    throw new Error(
      `Invalid encryption key format. Key must be either a 64-character hex string or 32-byte UTF-8 string (received ${buf.length} bytes).`
    );
  }

  throw new Error('Encryption key must be a string or Buffer.');
};

/**
 * Encrypt plaintext using AES-256-GCM with a cryptographically random IV.
 * @param {string} plaintext - Plaintext data to encrypt (e.g. GitHub OAuth access token)
 * @param {string | Buffer} [customKey] - Optional custom key override for testing
 * @returns {string} Serialized encrypted token string: "iv:authTag:ciphertext" (in hex)
 */
export const encrypt = (plaintext, customKey = null) => {
  if (typeof plaintext !== 'string' || plaintext.length === 0) {
    throw new Error('Plaintext to encrypt must be a non-empty string.');
  }

  const key = normalizeKey(customKey);
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });

  let encrypted = cipher.update(plaintext, 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return serialized string format "iv:authTag:ciphertext"
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt serialized AES-256-GCM ciphertext and verify authentication tag.
 * @param {string} serializedCiphertext - Serialized string "iv:authTag:ciphertext"
 * @param {string | Buffer} [customKey] - Optional custom key override
 * @returns {string} Decrypted plaintext string
 */
export const decrypt = (serializedCiphertext, customKey = null) => {
  if (!serializedCiphertext || typeof serializedCiphertext !== 'string') {
    throw new Error('Serialized ciphertext must be a non-empty string.');
  }

  const parts = serializedCiphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed ciphertext payload. Expected format: iv:authTag:ciphertext');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  if (ivHex.length !== IV_LENGTH_BYTES * 2) {
    throw new Error(`Invalid IV length. Expected ${IV_LENGTH_BYTES * 2} hex characters.`);
  }

  if (authTagHex.length !== AUTH_TAG_LENGTH_BYTES * 2) {
    throw new Error(`Invalid auth tag length. Expected ${AUTH_TAG_LENGTH_BYTES * 2} hex characters.`);
  }

  const key = normalizeKey(customKey);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    });

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');

    return decrypted;
  } catch (err) {
    // Cryptographic failure (e.g. tampered ciphertext or wrong key)
    throw new Error(`Decryption failed: integrity check failed or invalid key (${err.message}).`);
  }
};

export default {
  encrypt,
  decrypt,
  normalizeKey,
};

