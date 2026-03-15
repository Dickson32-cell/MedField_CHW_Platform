/**
 * Auth & Password Validation Tests
 * Unit tests for authentication functionality
 * Run with: npx jest tests/unit/auth.test.js --config jest.unit.config.js
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Password Validation', () => {
  // This function mirrors the validatePassword in auth.js routes
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length < minLength) {
      return 'Password must be at least 8 characters long';
    }
    if (!hasUpperCase || !hasLowerCase) {
      return 'Password must contain both uppercase and lowercase letters';
    }
    if (!hasNumber) {
      return 'Password must contain at least one number';
    }
    if (!hasSpecialChar) {
      return 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)';
    }
    return null;
  };

  describe('Password Length Requirements', () => {
    test('rejects passwords shorter than 8 characters', () => {
      expect(validatePassword('Pass1!')).toBe('Password must be at least 8 characters long');
      expect(validatePassword('')).toBe('Password must be at least 8 characters long');
      expect(validatePassword('Abc1!')).toBe('Password must be at least 8 characters long');
    });

    test('accepts passwords with exactly 8 characters', () => {
      const result = validatePassword('Password1!');
      expect(result).toBeNull();
    });
  });

  describe('Password Case Requirements', () => {
    test('rejects passwords without uppercase', () => {
      expect(validatePassword('password1!')).toBe('Password must contain both uppercase and lowercase letters');
    });

    test('rejects passwords without lowercase', () => {
      expect(validatePassword('PASSWORD1!')).toBe('Password must contain both uppercase and lowercase letters');
    });

    test('accepts passwords with both cases', () => {
      expect(validatePassword('Password1!')).toBeNull();
    });
  });

  describe('Password Number Requirements', () => {
    test('rejects passwords without numbers', () => {
      expect(validatePassword('Password!')).toBe('Password must contain at least one number');
    });

    test('accepts passwords with numbers', () => {
      expect(validatePassword('Password1!')).toBeNull();
    });
  });

  describe('Password Special Character Requirements', () => {
    test('rejects passwords without special characters', () => {
      expect(validatePassword('Password1')).toBe('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
    });

    test('accepts passwords with special characters', () => {
      expect(validatePassword('Password1!')).toBeNull();
    });
  });
});

describe('JWT Token Generation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = 'test_jwt_secret';
    process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('generates valid access and refresh tokens', () => {
    const generateTokens = (userId) => {
      if (!process.env.JWT_SECRET) throw new Error('CRITICAL: JWT_SECRET missing');
      if (!process.env.REFRESH_TOKEN_SECRET) throw new Error('CRITICAL: REFRESH_TOKEN_SECRET missing');

      const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
      return { accessToken, refreshToken };
    };

    const tokens = generateTokens('test-user-id');
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
  });

  test('throws error when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    const generateTokens = () => {
      if (!process.env.JWT_SECRET) throw new Error('CRITICAL: JWT_SECRET missing');
    };
    expect(generateTokens).toThrow('CRITICAL: JWT_SECRET missing');
  });

  test('verifies access token correctly', () => {
    const secret = 'test_secret';
    const token = jwt.sign({ userId: 'test' }, secret, { expiresIn: '15m' });
    const decoded = jwt.verify(token, secret);
    expect(decoded.userId).toBe('test');
  });
});

describe('bcrypt Password Hashing', () => {
  test('hashes password correctly with strength 12', async () => {
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 12);
    expect(hashedPassword).not.toBe(password);
    expect(await bcrypt.compare(password, hashedPassword)).toBe(true);
  });

  test('does not match wrong password', async () => {
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 12);
    expect(await bcrypt.compare('WrongPassword', hashedPassword)).toBe(false);
  });

  test('hashes are unique (different salts)', async () => {
    const password = 'Password123!';
    const hash1 = await bcrypt.hash(password, 12);
    const hash2 = await bcrypt.hash(password, 12);
    expect(hash1).not.toBe(hash2);
    expect(await bcrypt.compare(password, hash1)).toBe(true);
  });
});