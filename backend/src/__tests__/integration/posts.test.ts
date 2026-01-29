const request = require('supertest');
import { initializeTestDb, closeTestDb, clearTestDb } from '../helpers/testDb';
import { app } from '../../app';
import { AppDataSource } from '../../config/data-source';
import { Empresa } from '../../entities/Empresa';
import { Squad } from '../../entities/Squad';
import { Cliente } from '../../entities/Cliente';

describe('Posts API Complete', () => {
  let testUser: any;
  let authToken: string;
  let testEmpresa: Empresa;
  let testSquad: Squad;

  beforeAll(async () => {
    await initializeTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    
    // Create test hierarchy directly in database
    testEmpresa = await AppDataSource.getRepository(Empresa).save({
      nome: 'Test Empresa',
      cnpj: '12345678901234',
      ativo: true
    });
    
    testSquad = await AppDataSource.getRepository(Squad).save({
      nome: 'Test Squad',
      empresaId: testEmpresa.id,
      ativo: true
    });
    
    // Create user directly with squad to avoid register issues
    const bcryptjs = await import('bcryptjs');
    const hashedPassword = await bcryptjs.hash('senha123', 8);
    testUser = await AppDataSource.getRepository(Cliente).save({
      nome: 'Test User',
      email: 'test@example.com',
      senha: hashedPassword,
      squad: testSquad,  // Use full squad object instead of just squadId
      ativo: true
    });
    
    // Generate token manually
    const jwt = await import('jsonwebtoken');
    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email, type: 'cliente', squadId: testSquad.id },
      process.env.JWT_SECRET || 'test_jwt_secret_key',
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/posts', () => {
    beforeEach(async () => {
      // Create test posts for the authenticated user
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imagemUrl: 'https://example.com/post1.jpg',
          legenda: 'Primeiro post de teste',
          dataAgendada: new Date(Date.now() + 86400000).toISOString() // Tomorrow
        })
        .expect(201);

      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imagemUrl: 'https://example.com/post2.jpg',
          legenda: 'Segundo post de teste',
          dataAgendada: new Date(Date.now() + 172800000).toISOString() // Day after tomorrow
        })
        .expect(201);
    });

    it('should return all posts for authenticated client', async () => {
      const response = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(Array.isArray(response.body.posts)).toBe(true);
      expect(response.body.posts.length).toBe(2);
    });

    it('should filter posts by status', async () => {
      const response = await request(app)
        .get('/api/posts?status=Não aprovado')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.posts.length).toBe(2);
      response.body.posts.forEach((post: any) => {
        expect(post.status).toBe('Não aprovado');
      });
    });

    it('should filter posts by date range', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/posts?start_date=${tomorrow}&end_date=${dayAfter}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.posts.length).toBe(1);
      expect(response.body.posts[0].legenda).toBe('Primeiro post de teste');
    });

    it('should return empty array when no posts match filters', async () => {
      const lastMonth = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const lastMonthEnd = new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/posts?start_date=${lastMonth}&end_date=${lastMonthEnd}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.posts).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/posts')
        .expect(401);
    });
  });

  describe('GET /api/posts/:id', () => {
    let createdPostId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imagemUrl: 'https://example.com/post3.jpg',
          legenda: 'Post para teste individual'
        })
        .expect(201);
      
      createdPostId = createResponse.body.post.id;
    });

    it('should return post details for authenticated client', async () => {
      const response = await request(app)
        .get(`/api/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('post');
      expect(response.body.post.id).toBe(createdPostId);
      expect(response.body.post.legenda).toBe('Post para teste individual');
    });

    it('should return 404 for non-existent post', async () => {
      await request(app)
        .get('/api/posts/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/api/posts/${createdPostId}`)
        .expect(401);
    });
  });

  describe('POST /api/posts', () => {
    it('should create a new post successfully', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imagemUrl: 'https://example.com/new-post.jpg',
          legenda: 'Novo post de teste',
          dataAgendada: new Date(Date.now() + 259200000).toISOString() // 3 days from now
        })
        .expect(201);

      expect(response.body).toHaveProperty('post');
      expect(response.body.post).toHaveProperty('id');
      expect(response.body.post.legenda).toBe('Novo post de teste');
      expect(response.body.post.status).toBe('Não aprovado');
    });

    it('should return error when imagemUrl is invalid', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imagemUrl: 'invalid-url',
          legenda: 'Post com URL inválida'
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return error when imagemUrl is not provided', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          legenda: 'Post sem imagem'
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should create post without optional fields', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imagemUrl: 'https://example.com/minimal-post.jpg'
        })
        .expect(201);

      expect(response.body).toHaveProperty('post');
      expect(response.body.post).toHaveProperty('id');
      expect(response.body.post.legenda).toBeNull();
      expect(response.body.post.dataAgendada).toBeNull();
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/posts')
        .send({
          imagemUrl: 'https://example.com/unauthorized.jpg',
          legenda: 'Post não autorizado'
        })
        .expect(401);
    });
  });

  describe('PATCH /api/posts/:id/status', () => {
    let createdPostId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imagemUrl: 'https://example.com/post3.jpg',
          legenda: 'Post para mudança de status'
        })
        .expect(201);
      
      createdPostId = createResponse.body.post.id;
    });

    it('should approve post successfully', async () => {
      const response = await request(app)
        .patch(`/api/posts/${createdPostId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'Aprovado'
        })
        .expect(200);

      expect(response.body).toHaveProperty('post');
      expect(response.body.post.status).toBe('Aprovado');
    });

    it('should reject post with comment', async () => {
      const response = await request(app)
        .patch(`/api/posts/${createdPostId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'Não aprovado',
          comentarioCliente: 'Conteúdo inadequado'
        })
        .expect(200);

      expect(response.body.post.status).toBe('Não aprovado');
      expect(response.body.post.comentarioCliente).toBe('Conteúdo inadequado');
    });

    it('should approve post successfully', async () => {
      const response = await request(app)
        .patch(`/api/posts/${createdPostId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'Aprovado'
        })
        .expect(200);

      expect(response.body.post.status).toBe('Aprovado');
    });

    it('should return error when rejecting without comment', async () => {
      const response = await request(app)
        .patch(`/api/posts/${createdPostId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'Não aprovado'
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Comentário do cliente é obrigatório ao reprovar');
    });

    it('should return error for invalid status', async () => {
      const response = await request(app)
        .patch(`/api/posts/${createdPostId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'Status inválido'
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent post', async () => {
      await request(app)
        .patch('/api/posts/550e8400-e29b-41d4-a716-446655440000/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'Aprovado'
        })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .patch(`/api/posts/${createdPostId}/status`)
        .send({
          status: 'Aprovado'
        })
        .expect(401);
    });
  });

  describe('GET /api/posts/calendar/:year/:month', () => {
    beforeEach(async () => {
      // Create posts for calendar tests
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imagemUrl: 'https://example.com/calendar1.jpg',
          legenda: 'Post Janeiro',
          dataAgendada: new Date(Date.now() + 86400000).toISOString() // Tomorrow
        })
        .expect(201);

      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imagemUrl: 'https://example.com/calendar2.jpg',
          legenda: 'Post Fevereiro',
          dataAgendada: new Date(Date.now() + 172800000).toISOString() // Day after tomorrow
        })
        .expect(201);
    });

    it('should return calendar posts for specified month', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      const response = await request(app)
        .get(`/api/posts/calendar/${year}/${month}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(Array.isArray(response.body.posts)).toBe(true);
      expect(response.body.posts.length).toBe(2);
    });

    it('should return empty array for month with no posts', async () => {
      const response = await request(app)
        .get('/api/posts/calendar/2025/3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.posts).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/posts/calendar/2025/12')
        .expect(401);
    });
  });
});
