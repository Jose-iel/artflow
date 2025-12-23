import request from 'supertest';
import { AppDataSource } from '../../config/data-source';
import { User, UserRole } from '../../entities/User';
import { Empresa } from '../../entities/Empresa';
import { Squad } from '../../entities/Squad';
import { Cliente } from '../../entities/Cliente';
import { app } from '../../app';
import jwt from 'jsonwebtoken';
import { clearTestDb } from '../helpers/testDb';

describe('Squads API Integration Tests', () => {
  let adminMasterToken: string;
  let funcionarioToken: string;
  let clienteToken: string;
  let adminMaster: User;
  let funcionario: User;
  let cliente: Cliente;
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

  describe('GET /api/squads', () => {
    it('should return all squads for admin master', async () => {
      const response = await request(app)
        .get('/api/squads')
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].empresa).toBeDefined();
    });

    it('should return only squad for funcionário', async () => {
      const response = await request(app)
        .get('/api/squads')
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(testSquad.id);
    });

    it('should return only squad for cliente', async () => {
      const response = await request(app)
        .get('/api/squads')
        .set('Authorization', `Bearer ${clienteToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(testSquad.id);
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/squads')
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Token de autenticação não fornecido');
    });
  });

  describe('POST /api/squads', () => {
    it('should create new squad for admin master', async () => {
      const newSquad = {
        nome: 'New Squad',
        descricao: 'New squad description',
        empresaId: testEmpresa.id
      };

      const response = await request(app)
        .post('/api/squads')
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send(newSquad)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.nome).toBe(newSquad.nome);
      expect(response.body.data.empresa.id).toBe(testEmpresa.id);
    });

    it('should deny access for funcionário', async () => {
      const response = await request(app)
        .post('/api/squads')
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({
          nome: 'New Squad',
          empresaId: testEmpresa.id
        })
        .expect(403);

      expect(response.body.status).toBe('error');
    });

    it('should validate empresa exists', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .post('/api/squads')
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send({
          nome: 'New Squad',
          empresaId: fakeId
        })
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Empresa não encontrada');
    });
  });

  describe('GET /api/squads/:id', () => {
    it('should return squad with relations for admin master', async () => {
      const response = await request(app)
        .get(`/api/squads/${testSquad.id}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe(testSquad.id);
      expect(response.body.data.empresa).toBeDefined();
      expect(response.body.data.funcionarios).toBeDefined();
      expect(response.body.data.clientes).toBeDefined();
    });

    it('should allow access to own squad for non-admin users', async () => {
      // Test funcionário
      const funcResponse = await request(app)
        .get(`/api/squads/${testSquad.id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(200);
      expect(funcResponse.body.data.id).toBe(testSquad.id);

      // Test cliente
      const clienteResponse = await request(app)
        .get(`/api/squads/${testSquad.id}`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .expect(200);
      expect(clienteResponse.body.data.id).toBe(testSquad.id);
    });

    it('should deny access to other squad for non-admin users', async () => {
      // Test funcionário
      const funcResponse = await request(app)
        .get(`/api/squads/${otherSquad.id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(403);
      expect(funcResponse.body.message).toBe('Acesso negado');

      // Test cliente
      const clienteResponse = await request(app)
        .get(`/api/squads/${otherSquad.id}`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .expect(403);
      expect(clienteResponse.body.message).toBe('Acesso negado');
    });

    it('should return 404 for non-existent squad', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/api/squads/${fakeId}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(404);

      expect(response.body.message).toBe('Squad não encontrada');
    });
  });

  describe('PUT /api/squads/:id', () => {
    it('should update squad for admin master', async () => {
      const updateData = {
        nome: 'Updated Squad',
        descricao: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/squads/${testSquad.id}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.nome).toBe(updateData.nome);
      expect(response.body.data.descricao).toBe(updateData.descricao);
    });

    it('should deny access for funcionário', async () => {
      const response = await request(app)
        .put(`/api/squads/${testSquad.id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({ nome: 'Updated' })
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });

  describe('DELETE /api/squads/:id', () => {
    it('should delete empty squad for admin master', async () => {
      // Create a separate squad for deletion test
      const deleteSquad = await AppDataSource.getRepository(Squad).save({
        nome: 'Delete Squad',
        empresaId: testEmpresa.id
      });

      const response = await request(app)
        .delete(`/api/squads/${deleteSquad.id}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Squad excluída com sucesso');

      // Verify it's deleted
      const verify = await request(app)
        .get(`/api/squads/${deleteSquad.id}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(404);
    });

    it('should not delete squad with users', async () => {
      const response = await request(app)
        .delete(`/api/squads/${testSquad.id}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Não é possível excluir squad que possui funcionários ou clientes');
    });

    it('should deny access for funcionário', async () => {
      const response = await request(app)
        .delete(`/api/squads/${testSquad.id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/squads/:id/funcionarios', () => {
    it('should add funcionário to squad for admin master', async () => {
      // Create new funcionário without squad
      const newFuncionario = await AppDataSource.getRepository(User).save({
        nome: 'New Funcionario',
        email: 'newfunc@artflow.com',
        senha: '$2b$08$KljYyVpgtaoPjxyx6k3HleInL4gESumyDY4h8k3Iqh.h4vPOvAd0O',
        role: UserRole.FUNCIONARIO,
        ativo: true
      });

      const response = await request(app)
        .post(`/api/squads/${testSquad.id}/funcionarios`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send({ usuarioId: newFuncionario.id })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Funcionário adicionado à squad com sucesso');

      // Verify funcionário was added
      const updatedFuncionario = await AppDataSource.getRepository(User).findOne({
        where: { id: newFuncionario.id }
      });
      expect(updatedFuncionario?.squadId).toBe(testSquad.id);
    });

    it('should allow funcionário to add another funcionário to own squad', async () => {
      // Create new funcionário without squad
      const newFuncionario = await AppDataSource.getRepository(User).save({
        nome: 'New Funcionario 2',
        email: 'newfunc2@artflow.com',
        senha: '$2b$08$KljYyVpgtaoPjxyx6k3HleInL4gESumyDY4h8k3Iqh.h4vPOvAd0O',
        role: UserRole.FUNCIONARIO,
        ativo: true
      });

      const response = await request(app)
        .post(`/api/squads/${testSquad.id}/funcionarios`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({ usuarioId: newFuncionario.id })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Funcionário adicionado à squad com sucesso');
    });

    it('should deny funcionário to add to different squad', async () => {
      const newFuncionario = await AppDataSource.getRepository(User).save({
        nome: 'New Funcionario 3',
        email: 'newfunc3@artflow.com',
        senha: '$2b$08$KljYyVpgtaoPjxyx6k3HleInL4gESumyDY4h8k3Iqh.h4vPOvAd0O',
        role: UserRole.FUNCIONARIO,
        ativo: true
      });

      const response = await request(app)
        .post(`/api/squads/${otherSquad.id}/funcionarios`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({ usuarioId: newFuncionario.id })
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Acesso negado');
    });

    it('should validate funcionário exists and is FUNCIONARIO role', async () => {
      // UUID válido mas que não existe no banco
      const nonExistentUuid = '00000000-0000-4000-a000-000000000000';
      const response = await request(app)
        .post(`/api/squads/${testSquad.id}/funcionarios`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send({ usuarioId: nonExistentUuid })
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Funcionário não encontrado');
    });

    it('should reject adding non-funcionário user', async () => {
      const response = await request(app)
        .post(`/api/squads/${testSquad.id}/funcionarios`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send({ usuarioId: adminMaster.id })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Usuário não é um funcionário');
    });
  });

  describe('DELETE /api/squads/:id/funcionarios/:usuarioId', () => {
    it('should remove funcionário from squad', async () => {
      // Create a dedicated funcionário for this test to avoid state issues
      const funcToRemove = await AppDataSource.getRepository(User).save({
        nome: 'Func To Remove',
        email: 'functoremove@artflow.com',
        senha: '$2b$08$KljYyVpgtaoPjxyx6k3HleInL4gESumyDY4h8k3Iqh.h4vPOvAd0O',
        role: UserRole.FUNCIONARIO,
        squadId: testSquad.id,
        ativo: true
      });

      const response = await request(app)
        .delete(`/api/squads/${testSquad.id}/funcionarios/${funcToRemove.id}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(200);

      expect(response.body.message).toBe('Funcionário removido da squad com sucesso');

      // Verify funcionário was removed
      const updated = await AppDataSource.getRepository(User).findOne({
        where: { id: funcToRemove.id }
      });
      expect(updated?.squadId).toBeNull();
    });

    it('should not allow funcionário to remove himself', async () => {
      const response = await request(app)
        .delete(`/api/squads/${testSquad.id}/funcionarios/${funcionario.id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(400);

      expect(response.body.message).toBe('Não pode remover a si mesmo da squad');
    });

    it('should deny funcionário to remove from different squad', async () => {
      const otherFuncionario = await AppDataSource.getRepository(User).save({
        nome: 'Other Squad Func',
        email: 'othersquadfunc@artflow.com',
        senha: '$2b$08$KljYyVpgtaoPjxyx6k3HleInL4gESumyDY4h8k3Iqh.h4vPOvAd0O',
        role: UserRole.FUNCIONARIO,
        squadId: otherSquad.id,
        ativo: true
      });

      const response = await request(app)
        .delete(`/api/squads/${otherSquad.id}/funcionarios/${otherFuncionario.id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/squads/:id/clientes', () => {
    it('should create new cliente in squad', async () => {
      const newCliente = {
        nome: 'New Cliente',
        email: 'newcliente@artflow.com',
        senha: 'senha123'
      };

      const response = await request(app)
        .post(`/api/squads/${testSquad.id}/clientes`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send(newCliente)
        .expect(201);

      expect(response.body.message).toBe('Cliente adicionado à squad com sucesso');
      expect(response.body.data.nome).toBe(newCliente.nome);
      expect(response.body.data.squadId).toBe(testSquad.id);
    });

    it('should add existing cliente to squad', async () => {
      // Create cliente without squad
      const existingCliente = await AppDataSource.getRepository(Cliente).save({
        nome: 'Existing Cliente',
        email: 'existing@artflow.com',
        senha: '$2b$08$KljYyVpgtaoPjxyx6k3HleInL4gESumyDY4h8k3Iqh.h4vPOvAd0O',
        squadId: null,
        ativo: true
      });

      const response = await request(app)
        .post(`/api/squads/${testSquad.id}/clientes`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send({ clienteId: existingCliente.id })
        .expect(201);

      expect(response.body.data.id).toBe(existingCliente.id);
      expect(response.body.data.squadId).toBe(testSquad.id);
    });

    it('should deny funcionário to add cliente to different squad', async () => {
      const response = await request(app)
        .post(`/api/squads/${otherSquad.id}/clientes`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .send({ nome: 'Test', email: 'test@test.com', senha: 'senha123' })
        .expect(403);

      expect(response.body.message).toBe('Acesso negado');
    });

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post(`/api/squads/${testSquad.id}/clientes`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .send({ nome: 'Duplicate', email: 'cliente@artflow.com', senha: 'senha123' })
        .expect(400);

      expect(response.body.message).toBe('Email já cadastrado');
    });
  });

  describe('DELETE /api/squads/:id/clientes/:clienteId', () => {
    it('should remove cliente from squad', async () => {
      // Create a dedicated cliente for this test to avoid state issues
      const clienteToRemove = await AppDataSource.getRepository(Cliente).save({
        nome: 'Cliente To Remove',
        email: 'clientetoremove@artflow.com',
        senha: '$2b$08$KljYyVpgtaoPjxyx6k3HleInL4gESumyDY4h8k3Iqh.h4vPOvAd0O',
        squadId: testSquad.id,
        ativo: true
      });

      const response = await request(app)
        .delete(`/api/squads/${testSquad.id}/clientes/${clienteToRemove.id}`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(200);

      expect(response.body.message).toBe('Cliente removido da squad com sucesso');

      // Verify cliente was removed from squad
      const updated = await AppDataSource.getRepository(Cliente).findOne({
        where: { id: clienteToRemove.id }
      });
      expect(updated?.squadId).toBeNull();
    });

    it('should deny funcionário to remove cliente from different squad', async () => {
      const otherCliente = await AppDataSource.getRepository(Cliente).save({
        nome: 'Other Squad Cliente',
        email: 'othersquadcliente@artflow.com',
        senha: '$2b$08$KljYyVpgtaoPjxyx6k3HleInL4gESumyDY4h8k3Iqh.h4vPOvAd0O',
        squadId: otherSquad.id,
        ativo: true
      });

      const response = await request(app)
        .delete(`/api/squads/${otherSquad.id}/clientes/${otherCliente.id}`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/squads/:id/membros', () => {
    it('should return squad members with correct structure', async () => {
      const response = await request(app)
        .get(`/api/squads/${testSquad.id}/membros`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(200);

      expect(response.body.data.squad.id).toBe(testSquad.id);
      expect(Array.isArray(response.body.data.funcionarios)).toBe(true);
      expect(Array.isArray(response.body.data.clientes)).toBe(true);
    });

    it('should deny access to different squad', async () => {
      const response = await request(app)
        .get(`/api/squads/${otherSquad.id}/membros`)
        .set('Authorization', `Bearer ${funcionarioToken}`)
        .expect(403);

      expect(response.body.message).toBe('Acesso negado');
    });
  });

  describe('GET /api/squads/:id/statistics', () => {
    it('should return squad statistics with member counts', async () => {
      const response = await request(app)
        .get(`/api/squads/${testSquad.id}/statistics`)
        .set('Authorization', `Bearer ${adminMasterToken}`)
        .expect(200);

      expect(response.body.data.squad.id).toBe(testSquad.id);
      expect(response.body.data.totalFuncionarios).toBe(1);
      expect(response.body.data.totalClientes).toBe(1);
    });
  });
});
