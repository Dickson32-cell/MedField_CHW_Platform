// Jest setup file
const dotenv = require('dotenv');

// Load test environment
dotenv.config({ path: '.env.test' });

// Mock Redis for tests
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([])
  }));
});

// Mock logger to reduce noise in tests
jest.mock('./src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

// Global test timeout
jest.setTimeout(10000);