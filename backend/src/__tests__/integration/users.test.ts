import request from 'supertest';
import { AppDataSource } from '../../config/data-source';
import { User, UserRole } from '../../entities/User';
import { Empresa } from '../../entities/Empresa';
import { Squad } from '../../entities/Squad';
import { app } from '../../app';
import jwt from 'jsonwebtoken';
import { clearTestDb } from '../helpers/testDb';
import bcrypt from 'bcryptjs';

describe('Users API Integration Tests', () => {
  let adminMasterToken: string;
  let funcionarioToken: string;
  let clienteToken: string;
  let adminMaster: User;
  let funcionario: User;
  let cliente: User;
  let testEmpresa: Empresa;
  let testSquad: Squad;
  let otherSquad: Squad;

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    // Clean database using the helper
    await clearTestDb();

    // Generate password hash
    const hashedPassword = await bcrypt.hash('senha123', 8);

    // Create admin master user
    adminMaster = await AppDataSource.getRepository(User).save({
      nome: 'Admin Master',
      email: 'admin@artflow.com',
      senha: hashedPassword,
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
      senha: hashedPassword,
      role: UserRole.FUNCIONARIO,
      squadId: testSquad.id,
      ativo: true
    });

    // Create cliente user
    cliente = await AppDataSource.getRepository(User).save({
      nome: 'Cliente User',
      email: 'cliente@artflow.com',
      senha: hashedPassword,
      role: UserRole.CLIENT,
      squadId: testSquad.id,
      ativo: true
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
      { id: cliente.id, email: cliente.email, type: 'user' },
      jwtSecret,
      { expiresIn: '24h' }
    );
  });

  describe('POST /api/users/login', () => {
    it('should login admin master successfully', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'admin@artflow.com',
          senha: 'senha123'
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.role).toBe(UserRole.ADMIN_MASTER);
      expect(response.body.data.user.senha).toBeUndefined();
    });

    it('should login funcionário successfully', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'funcionario@artflow.com',
          senha: 'senha123'
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.role).toBe(UserRole.FUNCIONARIO);
      expect(response.body.data.user.squadId).toBe(testSquad.id);
    });

    it('should login cliente successfully', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'cliente@artflow.com',
          senha: 'senha123'
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.role).toBe(UserRole.CLIENT);
      expect(response.body.data.user.squadId).toBe(testSquad.id);
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'admin@artflow.com',
          senha: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Email ou senha incorretos');
    });

    it('should reject inactive user', async () => {
      // Generate password hash for inactive user
      const inactiveHashedPassword = await bcrypt.hash('senha123', 8);
      
      // Create inactive user
      const inactiveUser = await AppDataSource.getRepository(User).save({
        nome: 'Inactive User',
        email: 'inactive@artflow.com',
        senha: inactiveHashedPassword,
        role: UserRole.CLIENT,
        ativo: false
      });

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'inactive@artflow.com',
          senha: 'senha123'
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Email ou senha incorretos');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'admin@artflow.com'
          // Missing senha
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Senha é obrigatória');
    });
  });

  describe('GET /api/users', () => {
    it('should return all users for admin master', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].senha).toBeUndefined();
      expect(response.body.data[0].squad).toBeDefined();
    });

    it('should return squad users for funcionário', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(2); // funcionario + cliente
      expect(response.body.data.every((u: User) => u.squadId === testSquad.id)).toBe(true);
    });

    it('should return only self for cliente', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${clienteToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(cliente.id);
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Token de autenticação não fornecido');
    });
  });

  describe('POST /api/users', () => {
    it('should create new user for admin master', async () => {
      const newUser = {
        nome: 'New User',
        email: 'newuser@artflow.com',
        senha: 'newpassword123',
        role: UserRole.FUNCIONARIO,
        squadId: testSquad.id
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send(newUser)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.nome).toBe(newUser.nome);
      expect(response.body.data.email).toBe(newUser.email);
      expect(response.body.data.senha).toBeUndefined();
    });

    it('should deny access for funcionário', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({
          nome: 'New User',
          email: 'newuser@artflow.com',
          senha: 'newpassword123',
          role: UserRole.CLIENT
        })
        .expect(403);

      expect(response.body.status).toBe('error');
    });

    it('should validate unique email', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send({
          nome: 'Duplicate User',
          email: 'admin@artflow.com', // Already exists
          senha: 'password123',
          role: UserRole.CLIENT
        })
        .expect(400); // Should return 400 with validation error

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Email já cadastrado');
    });

    it('should validate squad exists for non-admin users', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send({
          nome: 'New User',
          email: 'newuser2@artflow.com',
          senha: 'password123',
          role: UserRole.FUNCIONARIO,
          squadId: fakeId
        })
        .expect(404); // Squad not found

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Squad não encontrada');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by ID for admin master', async () => {
      const response = await request(app)
        .get(`/api/users/${funcionario.id}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe(funcionario.id);
      expect(response.body.data.senha).toBeUndefined();
    });

    it('should return own profile for funcionário', async () => {
      const response = await request(app)
        .get(`/api/users/${funcionario.id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe(funcionario.id);
    });

    it('should deny access for funcionário to other user', async () => {
      const response = await request(app)
        .get(`/api/users/${adminMaster.id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Acesso negado a dados de outro usuário');
    });

    it('should return own profile for cliente', async () => {
      const response = await request(app)
        .get(`/api/users/${cliente.id}`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe(cliente.id);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Usuário não encontrado');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user for admin master', async () => {
      const updateData = {
        nome: 'Updated User',
        email: 'updated@artflow.com',
        role: UserRole.CLIENT,
        squadId: otherSquad.id,
        ativo: false
      };

      const response = await request(app)
        .put(`/api/users/${funcionario.id}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.nome).toBe(updateData.nome);
      expect(response.body.data.email).toBe(updateData.email);
      expect(response.body.data.role).toBe(updateData.role);
      expect(response.body.data.ativo).toBe(updateData.ativo);
      
      // Verify squadId was updated by checking the database directly
      const updatedUser = await AppDataSource.getRepository(User).findOne({
        where: { id: funcionario.id }
      });
      expect(updatedUser?.squadId).toBe(otherSquad.id);
    });

    it('should update own profile for funcionário', async () => {
      const updateData = {
        nome: 'Updated Funcionario',
        email: 'updatedfunc@artflow.com'
      };

      const response = await request(app)
        .put(`/api/users/${funcionario.id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.nome).toBe(updateData.nome);
      expect(response.body.data.email).toBe(updateData.email);
    });

    it('should deny role/squad/ativo changes for non-admin', async () => {
      const response = await request(app)
        .put(`/api/users/${funcionario.id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({
          role: UserRole.ADMIN_MASTER,
          squadId: otherSquad.id,
          ativo: false
        })
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Apenas Admin Master pode alterar role, squad ou status');
    });

    it('should deny access for funcionário to other user', async () => {
      const response = await request(app)
        .put(`/api/users/${adminMaster.id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({ nome: 'Updated' })
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user for admin master', async () => {
      // Create a separate user for deletion test
      const deleteUser = await AppDataSource.getRepository(User).save({
        nome: 'Delete User',
        email: 'delete@artflow.com',
        senha: '$2b$08$KljYyVpgtaoPjxyx6k3HleInL4gESumyDY4h8k3Iqh.h4vPOvAd0O',
        role: UserRole.CLIENT
      });

      const response = await request(app)
        .delete(`/api/users/${deleteUser.id}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Usuário excluído com sucesso');

      // Verify it's deleted
      const verify = await request(app)
        .get(`/api/users/${deleteUser.id}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(404);
    });

    it('should not delete admin master', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminMaster.id}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Não é possível excluir usuários Admin Master');
    });

    it('should deny access for funcionário', async () => {
      const response = await request(app)
        .delete(`/api/users/${cliente.id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });

  describe('PUT /api/users/:id/password', () => {
    it('should update own password for funcionário', async () => {
      const response = await request(app)
        .put(`/api/users/${funcionario.id}/password`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({
          senhaAtual: 'senha123',
          novaSenha: 'newpassword123'
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Senha atualizada com sucesso');

      // Verify login with new password
      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: 'funcionario@artflow.com',
          senha: 'newpassword123'
        })
        .expect(200);

      expect(loginResponse.body.status).toBe('success');
    });

    it('should update any password for admin master', async () => {
      const response = await request(app)
        .put(`/api/users/${funcionario.id}/password`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send({
          novaSenha: 'adminchanged123'
        })
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    it('should validate current password for non-admin', async () => {
      const response = await request(app)
        .put(`/api/users/${funcionario.id}/password`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({
          senhaAtual: 'wrongpassword',
          novaSenha: 'newpassword123'
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Senha atual incorreta');
    });

    it('should validate new password length', async () => {
      const response = await request(app)
        .put(`/api/users/${funcionario.id}/password`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({
          senhaAtual: 'senha123',
          novaSenha: '123'
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Nova senha deve ter pelo menos 6 caracteres');
    });

    it('should deny access for cliente to other user', async () => {
      const response = await request(app)
        .put(`/api/users/${funcionario.id}/password`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          senhaAtual: 'senha123',
          novaSenha: 'newpassword123'
        })
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });
});
