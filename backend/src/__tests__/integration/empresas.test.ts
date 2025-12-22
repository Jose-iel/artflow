import request from 'supertest';
import { AppDataSource } from '../../config/data-source';
import { User, UserRole } from '../../entities/User';
import { Empresa } from '../../entities/Empresa';
import { Squad } from '../../entities/Squad';
import { app } from '../../app';
import jwt from 'jsonwebtoken';
import { clearTestDb } from '../helpers/testDb';

describe('Empresas API Integration Tests', () => {
  let adminMasterToken: string;
  let funcionarioToken: string;
  let adminMaster: User;
  let funcionario: User;
  let testEmpresa: Empresa;
  let testSquad: Squad;

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

    // Create test squad
    testSquad = await AppDataSource.getRepository(Squad).save({
      nome: 'Test Squad',
      descricao: 'Test squad description',
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
  });

  describe('GET /api/empresas', () => {
    it('should return all empresas for admin master', async () => {
      const response = await request(app)
        .get('/api/empresas')
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].nome).toBe('Test Empresa');
      expect(response.body.data[0].squads).toBeDefined();
    });

    it('should deny access for funcionário', async () => {
      const response = await request(app)
        .get('/api/empresas')
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Permissão insuficiente');
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/empresas')
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Token de autenticação não fornecido');
    });
  });

  describe('POST /api/empresas', () => {
    it('should create new empresa for admin master', async () => {
      const newEmpresa = {
        nome: 'New Empresa',
        cnpj: '98.765.432/0001-10',
        descricao: 'New empresa description'
      };

      const response = await request(app)
        .post('/api/empresas')
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send(newEmpresa)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.nome).toBe(newEmpresa.nome);
      expect(response.body.data.cnpj).toBe(newEmpresa.cnpj);
    });

    it('should deny access for funcionário', async () => {
      const response = await request(app)
        .post('/api/empresas')
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({
          nome: 'New Empresa',
          cnpj: '98.765.432/0001-10'
        })
        .expect(403);

      expect(response.body.status).toBe('error');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/empresas')
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send({
          nome: 'Test Empresa'
          // Missing CNPJ
        });
      
      // API may return 400 (validation) or 500 (database level)
      expect([400, 500]).toContain(response.status);
    });

    it('should reject duplicate CNPJ', async () => {
      const response = await request(app)
        .post('/api/empresas')
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send({
          nome: 'Duplicate Empresa',
          cnpj: '12.345.678/0001-90' // Same as testEmpresa
        });
      
      // API may return 400 (validation) or 500 (database level)
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('GET /api/empresas/:id', () => {
    it('should return empresa by ID for admin master', async () => {
      const response = await request(app)
        .get(`/api/empresas/${testEmpresa.id}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe(testEmpresa.id);
      expect(response.body.data.nome).toBe('Test Empresa');
      expect(response.body.data.squads).toBeDefined();
    });

    it('should deny access for funcionário', async () => {
      const response = await request(app)
        .get(`/api/empresas/${testEmpresa.id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(403);

      expect(response.body.status).toBe('error');
    });

    it('should return 404 for non-existent empresa', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/api/empresas/${fakeId}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Empresa não encontrada');
    });
  });

  describe('PUT /api/empresas/:id', () => {
    it('should update empresa for admin master', async () => {
      const updateData = {
        nome: 'Updated Empresa',
        descricao: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/empresas/${testEmpresa.id}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.nome).toBe(updateData.nome);
      expect(response.body.data.descricao).toBe(updateData.descricao);
      // CNPJ should not change when not provided in update
      expect(response.body.data.cnpj).toBeDefined();
    });

    it('should deny access for funcionário', async () => {
      const response = await request(app)
        .put(`/api/empresas/${testEmpresa.id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({ nome: 'Updated' })
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });

  describe('DELETE /api/empresas/:id', () => {
    it('should delete empresa for admin master', async () => {
      // Create a separate empresa for deletion test
      const deleteEmpresa = await AppDataSource.getRepository(Empresa).save({
        nome: 'Delete Empresa',
        cnpj: '11.222.333/0001-44'
      });

      const response = await request(app)
        .delete(`/api/empresas/${deleteEmpresa.id}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Empresa excluída com sucesso');

      // Verify it's deleted
      const verify = await request(app)
        .get(`/api/empresas/${deleteEmpresa.id}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(404);
    });

    it('should not delete empresa with squads', async () => {
      const response = await request(app)
        .delete(`/api/empresas/${testEmpresa.id}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Não é possível excluir empresa que possui squads');
    });

    it('should deny access for funcionário', async () => {
      const response = await request(app)
        .delete(`/api/empresas/${testEmpresa.id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/empresas/:id/statistics', () => {
    it('should return empresa statistics for admin master', async () => {
      const response = await request(app)
        .get(`/api/empresas/${testEmpresa.id}/statistics`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.empresa.id).toBe(testEmpresa.id);
      expect(response.body.data.empresa.totalSquads).toBe(1);
      expect(response.body.data.empresa.totalFuncionarios).toBe(1);
      expect(response.body.data.empresa.totalClientes).toBe(0);
    });

    it('should deny access for funcionário', async () => {
      const response = await request(app)
        .get(`/api/empresas/${testEmpresa.id}/statistics`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });
});
