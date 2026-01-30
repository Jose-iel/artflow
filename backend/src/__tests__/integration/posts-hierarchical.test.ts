import request from 'supertest';
import { AppDataSource } from '../../config/data-source';
import { User, UserRole } from '../../entities/User';
import { Cliente } from '../../entities/Cliente';
import { Empresa } from '../../entities/Empresa';
import { Squad } from '../../entities/Squad';
import { Post, PostStatus } from '../../entities/Post';
import { app } from '../../app';
import jwt from 'jsonwebtoken';
import { clearTestDb } from '../helpers/testDb';

describe('Posts API Hierarchical Tests', () => {
  let adminMasterToken: string;
  let funcionarioToken: string;
  let clienteToken: string;
  let adminMaster: User;
  let funcionario: User;
  let cliente: Cliente;
  let testEmpresa: Empresa;
  let testSquad: Squad;
  let otherSquad: Squad;
  let testPost: Post;
  let otherPost: Post;

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    // Clean database using the helper
    await clearTestDb();

    // Create admin master user
    adminMaster = await AppDataSource.getRepository(User).save({
      nome: 'Admin Master',
      email: 'admin@artflow.com',
      senha: '$2b$08$KljYyVpgtaoPjxyx6k3HleInL4gESumyDY4h8k3Iqh.h4vPOvAd0O', // 'senha123'
      role: UserRole.ADMIN_MASTER,
      ativo: true
    });

    // Create test empresa
    testEmpresa = await AppDataSource.getRepository(Empresa).save({
      nome: 'Test Empresa',
      cnpj: '12.345.678/0001-90',
      descricao: 'Test empresa description'
    });

    // Create test squads
    testSquad = await AppDataSource.getRepository(Squad).save({
      nome: 'Test Squad',
      descricao: 'Test squad description',
      empresaId: testEmpresa.id
    });

    otherSquad = await AppDataSource.getRepository(Squad).save({
      nome: 'Other Squad',
      descricao: 'Other squad description',
      empresaId: testEmpresa.id
    });

    // Create funcionário user
    funcionario = await AppDataSource.getRepository(User).save({
      nome: 'Funcionario User',
      email: 'funcionario@artflow.com',
      senha: '$2b$08$KljYyVpgtaoPjxyx6k3HleInL4gESumyDY4h8k3Iqh.h4vPOvAd0O', // 'senha123'
      role: UserRole.FUNCIONARIO,
      squadId: testSquad.id,
      ativo: true
    });

    // Create cliente user
    cliente = await AppDataSource.getRepository(Cliente).save({
      nome: 'Cliente User',
      email: 'cliente@artflow.com',
      senha: '$2b$08$KljYyVpgtaoPjxyx6k3HleInL4gESumyDY4h8k3Iqh.h4vPOvAd0O', // 'senha123'
      squadId: testSquad.id,
      ativo: true
    });

    // Create test posts with dataAgendada for calendar tests
    testPost = await AppDataSource.getRepository(Post).save({
      clienteId: cliente.id,
      squadId: testSquad.id,
      createdById: funcionario.id,
      imagePath: 'https://example.com/post1.jpg',
      legenda: 'Post from test squad',
      status: PostStatus.NAO_APROVADO,
      dataAgendada: new Date('2025-12-15T10:00:00Z')
    });

    otherPost = await AppDataSource.getRepository(Post).save({
      clienteId: cliente.id,
      squadId: otherSquad.id,
      createdById: adminMaster.id,
      imagePath: 'https://example.com/post2.jpg',
      legenda: 'Post from other squad',
      status: PostStatus.APROVADO,
      dataAgendada: new Date('2025-12-20T10:00:00Z')
    });

    // Generate tokens
    const jwtSecret = process.env.JWT_SECRET || 'test-secret';
    adminMasterToken = jwt.sign(
      { id: adminMaster.id, email: adminMaster.email, type: 'user' },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    funcionarioToken = jwt.sign(
      { id: funcionario.id, email: funcionario.email, type: 'user' },
      jwtSecret,
      { expiresIn: '24h' }
    );

    clienteToken = jwt.sign(
      { id: cliente.id, email: cliente.email, type: 'cliente' },
      jwtSecret,
      { expiresIn: '24h' }
    );
  });

  describe('GET /api/posts', () => {
    it('should return all posts for admin master', async () => {
      const response = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(200);

      expect(response.body.posts).toHaveLength(2);
      expect(response.body.posts.map((p: any) => p.id)).toContain(testPost.id);
      expect(response.body.posts.map((p: any) => p.id)).toContain(otherPost.id);
    });

    it('should return only squad posts for funcionário', async () => {
      const response = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(200);

      expect(response.body.posts).toHaveLength(1);
      expect(response.body.posts[0].id).toBe(testPost.id);
      expect(response.body.posts[0].squadId).toBe(testSquad.id);
    });

    it('should return only own posts for cliente', async () => {
      const response = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${clienteToken}`)
        .expect(200);

      expect(response.body.posts).toHaveLength(2); // Both posts belong to this client
      expect(response.body.posts.every((p: any) => p.clienteId === cliente.id)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/posts?status=Aprovado')
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(200);

      expect(response.body.posts).toHaveLength(1);
      expect(response.body.posts[0].status).toBe('Aprovado');
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/posts')
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Token de autenticação não fornecido');
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should return any post for admin master', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(200);

      expect(response.body.post.id).toBe(testPost.id);
      expect(response.body.post.squadId).toBe(testSquad.id);
    });

    it('should return own squad post for funcionário', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(200);

      expect(response.body.post.id).toBe(testPost.id);
    });

    it('should deny access for funcionário to other squad post', async () => {
      const response = await request(app)
        .get(`/api/posts/${otherPost.id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Acesso negado');
    });

    it('should return own post for cliente', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .expect(200);

      expect(response.body.post.id).toBe(testPost.id);
      expect(response.body.post.clienteId).toBe(cliente.id);
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/api/posts/${fakeId}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Post não encontrado');
    });
  });

  describe('POST /api/posts', () => {
    it('should create post for admin master', async () => {
      // Use dynamic future date to avoid test failures
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const newPost = {
        imagePath: 'https://example.com/new.jpg',
        legenda: 'New post by admin',
        dataAgendada: futureDate.toISOString(),
        clienteId: cliente.id
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send(newPost)
        .expect(201);

      expect(response.body.message).toBe('Post criado com sucesso');
      expect(response.body.post.clienteId).toBe(cliente.id);
      expect(response.body.post.squadId).toBe(testSquad.id);
      expect(response.body.post.createdById).toBe(adminMaster.id);
    });

    it('should create post for funcionário', async () => {
      // Use dynamic future date to avoid test failures
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const newPost = {
        imagePath: 'https://example.com/new.jpg',
        legenda: 'New post by funcionario',
        dataAgendada: futureDate.toISOString(),
        clienteId: cliente.id
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send(newPost)
        .expect(201);

      expect(response.body.post.createdById).toBe(funcionario.id);
      expect(response.body.post.squadId).toBe(testSquad.id);
    });

    it('should create post for cliente (self)', async () => {
      const newPost = {
        imagePath: 'https://example.com/new.jpg',
        legenda: 'New post by cliente'
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send(newPost)
        .expect(201);

      expect(response.body.post.clienteId).toBe(cliente.id);
      expect(response.body.post.squadId).toBe(testSquad.id);
      expect(response.body.post.createdById).toBeNull();
    });

    it('should deny funcionário creating post for client in other squad', async () => {
      // Create client in other squad
      const otherCliente = await AppDataSource.getRepository(Cliente).save({
        nome: 'Other Cliente',
        email: 'other@artflow.com',
        senha: '$2b$08$KljYyVpgtaoPjxyx6k3HleInL4gESumyDY4h8k3Iqh.h4vPOvAd0O',
        squadId: otherSquad.id
      });

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({
          imagePath: 'https://example.com/new.jpg',
          clienteId: otherCliente.id
        })
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Acesso negado - cliente de outra squad');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send({
          legenda: 'Post without image',
          clienteId: cliente.id
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Caminho da imagem é obrigatório');
    });
  });

  describe('PATCH /api/posts/:id/status', () => {
    it('should update status to any value for admin master', async () => {
      const response = await request(app)
        .patch(`/api/posts/${testPost.id}/status`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send({
          status: PostStatus.PUBLICADO,
          comentarioAdmin: 'Publicado pelo admin'
        })
        .expect(200);

      expect(response.body.message).toBe('Status atualizado com sucesso');
      expect(response.body.post.status).toBe('Publicado');
    });

    it('should allow funcionário to approve post', async () => {
      const response = await request(app)
        .patch(`/api/posts/${testPost.id}/status`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({
          status: PostStatus.APROVADO,
          comentarioAdmin: 'Aprovado pelo funcionário'
        })
        .expect(200);

      expect(response.body.post.status).toBe('Aprovado');
    });

    it('should allow funcionário to reject post without comment', async () => {
      const response = await request(app)
        .patch(`/api/posts/${testPost.id}/status`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({
          status: PostStatus.NAO_APROVADO
        })
        .expect(200);

      expect(response.body.post.status).toBe('Não aprovado');
    });

    it('should deny funcionário from publishing', async () => {
      const response = await request(app)
        .patch(`/api/posts/${testPost.id}/status`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({
          status: PostStatus.PUBLICADO
        })
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Funcionário só pode aprovar, reprovar ou agendar');
    });

    it('should allow cliente to approve own post', async () => {
      const response = await request(app)
        .patch(`/api/posts/${testPost.id}/status`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          status: PostStatus.APROVADO,
          comentarioCliente: 'Aprovado pelo cliente'
        })
        .expect(200);

      expect(response.body.post.status).toBe('Aprovado');
    });

    it('should allow cliente to reject own post', async () => {
      const response = await request(app)
        .patch(`/api/posts/${testPost.id}/status`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          status: PostStatus.NAO_APROVADO,
          comentarioCliente: 'Precisa mudar a imagem'
        })
        .expect(200);

      expect(response.body.post.status).toBe('Não aprovado');
    });

    it('should deny cliente from scheduling post', async () => {
      const response = await request(app)
        .patch(`/api/posts/${testPost.id}/status`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          status: PostStatus.AGENDADO
        })
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Cliente só pode aprovar ou reprovar posts');
    });

    it('should require comment when cliente rejects post', async () => {
      const response = await request(app)
        .patch(`/api/posts/${testPost.id}/status`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          status: PostStatus.NAO_APROVADO
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Comentário do cliente é obrigatório ao reprovar');
    });

    it('should deny access to other squad post for funcionário', async () => {
      const response = await request(app)
        .patch(`/api/posts/${otherPost.id}/status`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({
          status: PostStatus.APROVADO
        })
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Acesso negado');
    });
  });

  describe('GET /api/posts/calendar/:year/:month', () => {
    it('should return all calendar posts for admin master', async () => {
      const response = await request(app)
        .get('/api/posts/calendar/2025/12')
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(200);

      expect(response.body.posts).toHaveLength(2);
    });

    it('should return only squad calendar posts for funcionário', async () => {
      const response = await request(app)
        .get('/api/posts/calendar/2025/12')
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(200);

      expect(response.body.posts).toHaveLength(1);
      expect(response.body.posts[0].squadId).toBe(testSquad.id);
    });

    it('should return only own calendar posts for cliente', async () => {
      const response = await request(app)
        .get('/api/posts/calendar/2025/12')
        .set('Authorization', `Bearer ${clienteToken}`)
        .expect(200);

      expect(response.body.posts).toHaveLength(2);
      expect(response.body.posts.every((p: any) => p.clienteId === cliente.id)).toBe(true);
    });

    it('should validate month parameter', async () => {
      const response = await request(app)
        .get('/api/posts/calendar/2025/13')
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Parâmetros de ano e mês inválidos');
    });
  });
});
