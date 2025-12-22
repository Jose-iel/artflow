const request = require('supertest');
import { initializeTestDb, closeTestDb, clearTestDb } from '../helpers/testDb';
import { app } from '../../app';

describe('Auth API', () => {
  beforeAll(async () => {
    await initializeTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new client successfully', async () => {
      // Arrange
      const newClient = {
        nome: 'Test User',
        email: 'test@example.com',
        senha: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(newClient)
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('message', 'Cliente criado com sucesso');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('cliente');
      
      expect(response.body.cliente).toHaveProperty('id');
      expect(response.body.cliente).toHaveProperty('name', 'Test User');
      expect(response.body.cliente).toHaveProperty('email', 'test@example.com');
      expect(response.body.cliente).toHaveProperty('active', true);
      expect(response.body.cliente).toHaveProperty('createdAt');
      expect(response.body.cliente).toHaveProperty('updatedAt');

      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');
    });

    it('should return error when nome is empty', async () => {
      // Arrange
      const invalidClient = {
        nome: '',
        email: 'test@example.com',
        senha: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidClient)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Nome é obrigatório');
    });

    it('should return error when nome is only whitespace', async () => {
      // Arrange
      const invalidClient = {
        nome: '   ',
        email: 'test@example.com',
        senha: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidClient)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Nome é obrigatório');
    });

    it('should return error when nome is missing', async () => {
      // Arrange
      const invalidClient = {
        email: 'test@example.com',
        senha: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidClient)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Nome é obrigatório');
    });

    it('should return error when email is invalid', async () => {
      // Arrange
      const invalidClient = {
        nome: 'Test User',
        email: 'invalid-email',
        senha: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidClient)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'email inválido');
    });

    it('should return error when email is missing', async () => {
      // Arrange
      const invalidClient = {
        nome: 'Test User',
        senha: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidClient)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'email inválido');
    });

    it('should return error when senha is too short', async () => {
      // Arrange
      const invalidClient = {
        nome: 'Test User',
        email: 'test@example.com',
        senha: '123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidClient)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Senha deve ter pelo menos 8 caracteres');
    });

    it('should return error when senha is missing', async () => {
      // Arrange
      const invalidClient = {
        nome: 'Test User',
        email: 'test@example.com'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidClient)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Senha deve ter pelo menos 8 caracteres');
    });

    it('should return error when email already exists', async () => {
      // Arrange - Create first user
      await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'First User',
          email: 'test@example.com',
          senha: 'password123'
        })
        .expect(201);

      // Try to create second user with same email
      const duplicateClient = {
        nome: 'Second User',
        email: 'test@example.com',
        senha: 'password456'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateClient)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Email já cadastrado');
    });

    it('should trim whitespace from nome', async () => {
      // Arrange
      const clientWithWhitespace = {
        nome: '  Test User  ',
        email: 'test@example.com',
        senha: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(clientWithWhitespace)
        .expect(201);

      // Assert
      expect(response.body.cliente.name).toBe('Test User');
    });

    it('should convert email to lowercase', async () => {
      // Arrange
      const clientWithUppercaseEmail = {
        nome: 'Test User',
        email: 'TEST@EXAMPLE.COM',
        senha: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(clientWithUppercaseEmail)
        .expect(201);

      // Assert
      expect(response.body.cliente.email).toBe('test@example.com');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Test User',
          email: 'test@example.com',
          senha: 'password123'
        });
    });

    it('should login successfully with valid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        senha: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('message', 'Login realizado com sucesso');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('cliente');
      
      expect(response.body.cliente).toHaveProperty('id');
      expect(response.body.cliente).toHaveProperty('name', 'Test User');
      expect(response.body.cliente).toHaveProperty('email', 'test@example.com');
      expect(response.body.cliente).toHaveProperty('active', true);
      expect(response.body.cliente).toHaveProperty('createdAt');
      expect(response.body.cliente).toHaveProperty('updatedAt');

      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');
    });

    it('should return error when email is missing', async () => {
      // Arrange
      const invalidLogin = {
        senha: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLogin)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Email é obrigatório');
    });

    it('should return error when senha is missing', async () => {
      // Arrange
      const invalidLogin = {
        email: 'test@example.com'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLogin)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Senha é obrigatória');
    });

    it('should return error when email is invalid', async () => {
      // Arrange
      const invalidLogin = {
        email: 'invalid-email',
        senha: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLogin)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'email inválido');
    });

    it('should return error when email does not exist', async () => {
      // Arrange
      const invalidLogin = {
        email: 'nonexistent@example.com',
        senha: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLogin)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Credenciais inválidas');
    });

    it('should return error when password is incorrect', async () => {
      // Arrange
      const invalidLogin = {
        email: 'test@example.com',
        senha: 'wrongpassword'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLogin)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Credenciais inválidas');
    });

    it('should login with email in different case', async () => {
      // Arrange
      const loginWithUppercase = {
        email: 'TEST@EXAMPLE.COM',
        senha: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginWithUppercase)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('message', 'Login realizado com sucesso');
      expect(response.body).toHaveProperty('token');
      expect(response.body.cliente.email).toBe('test@example.com');
    });

    it('should reject login for inactive user', async () => {
      // Arrange - Create user and manually set as inactive
      await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Test User',
          email: 'inactive@example.com',
          senha: 'password123'
        })
        .expect(201);

      // Manually set user as inactive (simulate admin deactivation)
      const { AppDataSource } = require('../../config/data-source');
      const { Cliente } = require('../../entities/Cliente');
      const clienteRepo = AppDataSource.getRepository(Cliente);
      await clienteRepo.update({ email: 'inactive@example.com' }, { ativo: false });

      const loginData = {
        email: 'inactive@example.com',
        senha: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Credenciais inválidas');
    });
  });

  describe('Auth Integration', () => {
    it('should allow authenticated access after login', async () => {
      // Arrange - Register and login
      await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Test User',
          email: 'test@example.com',
          senha: 'password123'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          senha: 'password123'
        });

      const token = loginResponse.body.token;

      // Act - Use token to access protected endpoint
      const postsResponse = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(postsResponse.body).toHaveProperty('posts');
      expect(Array.isArray(postsResponse.body.posts)).toBe(true);
    });

    it('should reject access without token', async () => {
      // Act - Try to access protected endpoint without token
      const response = await request(app)
        .get('/api/posts')
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('status', 'error');
    });

    it('should reject access with invalid token', async () => {
      // Act - Try to access protected endpoint with invalid token
      const response = await request(app)
        .get('/api/posts')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('status', 'error');
    });
  });
});
