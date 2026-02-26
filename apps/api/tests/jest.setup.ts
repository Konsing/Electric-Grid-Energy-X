// Jest global setup — runs once before all test suites.
// IMPORTANT: These env vars MUST be set before any app module is imported,
// because config.ts reads process.env at module-load time via dotenv.
// dotenv.config() does NOT overwrite existing env vars, so setting them
// here guarantees the app config picks up the test values.
process.env.NODE_ENV = 'test';
process.env.MOCK_AUTH = 'true';
process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long!!';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
