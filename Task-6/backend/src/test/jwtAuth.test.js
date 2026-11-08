import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  generateToken,
  verifyToken,
  getAuthCookieOptions,
  parseDurationToMs,
  AUTH_COOKIE_NAME,
} from '../utils/tokenUtils.js';

describe('Phase 6: JWT Token & Cookie Utility Unit Test Suite', () => {
  const mockUser = {
    _id: '672e00000000000000000002',
    name: 'Alex Mercer',
    email: 'alex.mercer@forma.edu',
    role: 'Student',
  };

  describe('1. Duration Parsing (parseDurationToMs)', () => {
    it('should parse duration units correctly to milliseconds', () => {
      expect(parseDurationToMs('30s')).toBe(30 * 1000);
      expect(parseDurationToMs('15m')).toBe(15 * 60 * 1000);
      expect(parseDurationToMs('2h')).toBe(2 * 60 * 60 * 1000);
      expect(parseDurationToMs('1d')).toBe(24 * 60 * 60 * 1000);
      expect(parseDurationToMs('7d')).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should return default duration if input is invalid or missing', () => {
      const defaultVal = 86400000;
      expect(parseDurationToMs(null, defaultVal)).toBe(defaultVal);
      expect(parseDurationToMs('', defaultVal)).toBe(defaultVal);
      expect(parseDurationToMs('invalid', defaultVal)).toBe(defaultVal);
    });
  });

  describe('2. Cookie Options Generation', () => {
    it('should configure mandatory security options (httpOnly, sameSite, path, maxAge)', () => {
      const options = getAuthCookieOptions();

      expect(options.httpOnly).toBe(true);
      expect(options.path).toBe('/');
      expect(['lax', 'strict']).toContain(options.sameSite);
      expect(typeof options.secure).toBe('boolean');
      expect(options.maxAge).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe('3. JWT Token Generation (generateToken)', () => {
    it('should generate a valid 3-part JWT token signed with HMAC SHA-256', () => {
      const token = generateToken(mockUser);

      expect(typeof token).toBe('string');
      const parts = token.split('.');
      expect(parts).toHaveLength(3); // Header.Payload.Signature

      // Decode payload without verification to inspect claims
      const decoded = jwt.decode(token);
      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
      expect(decoded.iss).toBe('forma-student-intelligence-platform');
      expect(decoded).toHaveProperty('exp');
      expect(decoded).toHaveProperty('iat');
    });

    it('should fail safely if secret is missing or empty', () => {
      expect(() => generateToken(mockUser, { secret: '' })).toThrow(/JWT_SECRET.*missing or empty/i);
      expect(() => generateToken(mockUser, { secret: null })).toThrow(/JWT_SECRET.*missing or empty/i);
    });

    it('should fail safely if user object has no valid ID', () => {
      expect(() => generateToken({ email: 'noid@example.com' })).toThrow(/without valid user ID/i);
    });
  });

  describe('4. Cryptographic Verification (verifyToken)', () => {
    it('should successfully verify and decode an authentic token', () => {
      const token = generateToken(mockUser);
      const verified = verifyToken(token);

      expect(verified.id).toBe(mockUser._id);
      expect(verified.email).toBe(mockUser.email);
      expect(verified.role).toBe(mockUser.role);
      expect(verified.iss).toBe('forma-student-intelligence-platform');
    });

    it('should reject a tampered token with signature error', () => {
      const validToken = generateToken(mockUser);
      const parts = validToken.split('.');
      // Tamper with payload (modify middle part)
      const tamperedToken = `${parts[0]}.eyJpZCI6ImhhY2tlZCJ9.${parts[2]}`;

      expect(() => verifyToken(tamperedToken)).toThrow();
    });

    it('should reject a token signed with a different secret', () => {
      const rogueSecret = 'rogue_attacker_secret_key_1234567890';
      const rogueToken = generateToken(mockUser, { secret: rogueSecret });

      expect(() => verifyToken(rogueToken)).toThrow();
    });

    it('should reject an expired token', async () => {
      // Create token with immediate expiration
      const expiredToken = generateToken(mockUser, { expiresIn: '1ms' });
      // Wait 15ms so it definitely expires
      await new Promise((resolve) => setTimeout(resolve, 15));

      expect(() => verifyToken(expiredToken)).toThrow(/jwt expired/i);
    });

    it('should reject null or empty tokens', () => {
      expect(() => verifyToken(null)).toThrow(/No token provided/i);
      expect(() => verifyToken('')).toThrow(/No token provided/i);
    });
  });

  describe('5. Constant Contract Verification', () => {
    it('should use forma_token as standard auth cookie identifier', () => {
      expect(AUTH_COOKIE_NAME).toBe('forma_token');
    });
  });
});

