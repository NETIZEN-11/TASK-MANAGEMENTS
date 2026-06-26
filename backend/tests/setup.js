// Set test env BEFORE requiring config
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests_must_be_at_least_32_chars';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/task_management_test';
process.env.LOG_LEVEL = 'error';

// Silence logger noise during tests
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));