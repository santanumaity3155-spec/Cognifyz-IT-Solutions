import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, normalizeKey } from '../services/encryptionService.js';

describe('AES-256-GCM Encryption Service Tests', () => {
  const TEST_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const ALT_KEY = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
  const SAMPLE_TOKEN = 'gho_16C7e42F292c6912E7710c838347Ae178B4a';

  it('normalizes valid 64-character hex key to 32-byte Buffer', () => {
    const keyBuf = normalizeKey(TEST_KEY);
    expect(Buffer.isBuffer(keyBuf)).toBe(true);
    expect(keyBuf.length).toBe(32);
  });

  it('normalizes valid 32-byte UTF-8 string', () => {
    const string32Bytes = '12345678901234567890123456789012'; // exactly 32 chars
    const keyBuf = normalizeKey(string32Bytes);
    expect(keyBuf.length).toBe(32);
  });

  it('rejects keys with invalid lengths or non-hex formatting', () => {
    expect(() => normalizeKey('too-short')).toThrow(/Invalid encryption key/);
    expect(() => normalizeKey('not-hex-and-not-32-chars')).toThrow(/Invalid encryption key/);
  });

  it('encrypts and successfully decrypts a plaintext OAuth token', () => {
    const ciphertext = encrypt(SAMPLE_TOKEN, TEST_KEY);

    expect(typeof ciphertext).toBe('string');
    expect(ciphertext).toContain(':');

    const parts = ciphertext.split(':');
    expect(parts.length).toBe(3); // iv, authTag, encrypted
    expect(parts[0].length).toBe(24); // 12-byte IV -> 24 hex characters
    expect(parts[1].length).toBe(32); // 16-byte authTag -> 32 hex characters

    const decrypted = decrypt(ciphertext, TEST_KEY);
    expect(decrypted).toBe(SAMPLE_TOKEN);
  });

  it('generates a unique IV and different ciphertext for every encryption call', () => {
    const cipher1 = encrypt(SAMPLE_TOKEN, TEST_KEY);
    const cipher2 = encrypt(SAMPLE_TOKEN, TEST_KEY);

    expect(cipher1).not.toBe(cipher2);
    const iv1 = cipher1.split(':')[0];
    const iv2 = cipher2.split(':')[0];
    expect(iv1).not.toBe(iv2);
  });

  it('rejects decryption when using the wrong key', () => {
    const ciphertext = encrypt(SAMPLE_TOKEN, TEST_KEY);

    expect(() => decrypt(ciphertext, ALT_KEY)).toThrow(/Decryption failed/i);
  });

  it('rejects tampered ciphertext', () => {
    const ciphertext = encrypt(SAMPLE_TOKEN, TEST_KEY);
    const [iv, authTag, encrypted] = ciphertext.split(':');

    // Tamper with the encrypted bytes
    const tamperedEncrypted = encrypted.slice(0, -2) + (encrypted.endsWith('aa') ? 'bb' : 'aa');
    const tamperedPayload = `${iv}:${authTag}:${tamperedEncrypted}`;

    expect(() => decrypt(tamperedPayload, TEST_KEY)).toThrow(/Decryption failed/i);
  });

  it('rejects tampered authentication tag', () => {
    const ciphertext = encrypt(SAMPLE_TOKEN, TEST_KEY);
    const [iv, authTag, encrypted] = ciphertext.split(':');

    // Tamper with the auth tag
    const tamperedTag = authTag.slice(0, -2) + (authTag.endsWith('00') ? 'ff' : '00');
    const tamperedPayload = `${iv}:${tamperedTag}:${encrypted}`;

    expect(() => decrypt(tamperedPayload, TEST_KEY)).toThrow(/Decryption failed/i);
  });

  it('rejects empty or invalid plaintext to encrypt', () => {
    expect(() => encrypt('', TEST_KEY)).toThrow(/Plaintext to encrypt must be a non-empty string/);
    expect(() => encrypt(null, TEST_KEY)).toThrow();
  });
});

