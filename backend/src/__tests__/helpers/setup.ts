import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test-specific environment variables
process.env.NODE_ENV = 'test';
process.env.TEST_DB_DATABASE = process.env.TEST_DB_DATABASE || 'artflow_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key';

// Override database settings for tests
process.env.DB_HOST = process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT || process.env.DB_PORT || '5432';
process.env.DB_USERNAME = process.env.TEST_DB_USERNAME || process.env.DB_USERNAME || 'postgres';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres';
process.env.DB_DATABASE = process.env.DB_DATABASE || 'artflow';

// Increase timeout for integration tests
jest.setTimeout(30000);
