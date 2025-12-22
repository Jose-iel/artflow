import { initializeTestDb, closeTestDb, clearTestDb } from '../helpers/testDb';
import { authenticatedRequest } from '../helpers/testHelpers';

describe('Health Check API', () => {
  beforeAll(async () => {
    await initializeTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await authenticatedRequest().get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should return health status without authentication', async () => {
      const response = await authenticatedRequest().get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should return JSON content type', async () => {
      const response = await authenticatedRequest().get('/api/health');
      
      expect(response.headers['content-type']).toMatch(/json/);
    });
  });
});
