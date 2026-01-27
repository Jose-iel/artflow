import { UserController } from '../../../controllers/user.controller';
import { AppDataSource } from '../../../config/data-source';
import { User, UserRole } from '../../../entities/User';
import { Squad } from '../../../entities/Squad';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../../../config/data-source');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('UserController', () => {
  let userController: UserController;
  let mockRequest: any;
  let mockResponse: any;
  let mockUserRepository: any;
  let mockSquadRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    userController = new UserController();
    
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: undefined
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockUserRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn()
    };

    mockSquadRepository = {
      findOne: jest.fn()
    };

    Object.defineProperty(userController, 'userRepository', {
      get: () => mockUserRepository
    });
    Object.defineProperty(userController, 'squadRepository', {
      get: () => mockSquadRepository
    });

    process.env.JWT_SECRET = 'test-secret';
  });

  describe('getAll', () => {
    it('should return all users for ADMIN_MASTER', async () => {
      mockRequest.user = {
        id: 'admin-id',
        role: UserRole.ADMIN_MASTER
      };

      const users = [
        { id: 'user-1', nome: 'User 1', senha: 'hashed' },
        { id: 'user-2', nome: 'User 2', senha: 'hashed' }
      ];

      mockUserRepository.find.mockResolvedValue(users);

      await userController.getAll(mockRequest, mockResponse);

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        relations: ['squad', 'squad.empresa'],
        order: { criadoEm: 'DESC' }
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.arrayContaining([
          expect.not.objectContaining({ senha: expect.anything() })
        ])
      });
    });

    it('should return squad users for FUNCIONARIO', async () => {
      mockRequest.user = {
        id: 'func-id',
        role: UserRole.FUNCIONARIO,
        squadId: 'squad-1'
      };

      const users = [
        { id: 'user-1', nome: 'User 1', senha: 'hashed', squadId: 'squad-1' }
      ];

      mockUserRepository.find.mockResolvedValue(users);

      await userController.getAll(mockRequest, mockResponse);

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { squadId: 'squad-1' },
        relations: ['squad'],
        order: { criadoEm: 'DESC' }
      });
    });

    it('should return only self for CLIENT', async () => {
      mockRequest.user = {
        id: 'client-id',
        role: UserRole.CLIENT
      };

      const users = [
        { id: 'client-id', nome: 'Client', senha: 'hashed' }
      ];

      mockUserRepository.find.mockResolvedValue(users);

      await userController.getAll(mockRequest, mockResponse);

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { id: 'client-id' },
        relations: ['squad'],
        order: { criadoEm: 'DESC' }
      });
    });
  });

  describe('getById', () => {
    it('should return user by id for ADMIN_MASTER', async () => {
      mockRequest.user = {
        id: 'admin-id',
        role: UserRole.ADMIN_MASTER
      };
      mockRequest.params = { id: 'user-1' };

      const user = {
        id: 'user-1',
        nome: 'User 1',
        senha: 'hashed'
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      await userController.getById(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.not.objectContaining({ senha: expect.anything() })
      });
    });

    it('should return 404 when user not found', async () => {
      mockRequest.user = {
        id: 'admin-id',
        role: UserRole.ADMIN_MASTER
      };
      mockRequest.params = { id: 'nonexistent' };

      mockUserRepository.findOne.mockResolvedValue(null);

      await userController.getById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    });

    it('should return 403 when FUNCIONARIO tries to access different squad user', async () => {
      mockRequest.user = {
        id: 'func-id',
        role: UserRole.FUNCIONARIO,
        squadId: 'squad-1'
      };
      mockRequest.params = { id: 'user-2' };

      const user = {
        id: 'user-2',
        squadId: 'squad-2'
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      await userController.getById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Acesso negado'
      });
    });
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      mockRequest.user = {
        id: 'admin-id',
        role: UserRole.ADMIN_MASTER
      };
      mockRequest.body = {
        nome: 'New User',
        email: 'new@example.com',
        senha: 'password123',
        role: UserRole.FUNCIONARIO,
        squadId: 'squad-1'
      };

      const squad = { id: 'squad-1', nome: 'Squad 1' };
      const newUser = {
        id: 'new-user-id',
        nome: 'New User',
        email: 'new@example.com',
        role: UserRole.FUNCIONARIO,
        squadId: 'squad-1'
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockSquadRepository.findOne.mockResolvedValue(squad);
      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      mockUserRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...newUser, senha: 'hashed' });

      await userController.create(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.not.objectContaining({ senha: expect.anything() })
      });
    });

    it('should return 400 when email already exists', async () => {
      mockRequest.user = {
        id: 'admin-id',
        role: UserRole.ADMIN_MASTER
      };
      mockRequest.body = {
        nome: 'New User',
        email: 'existing@example.com',
        senha: 'password123',
        role: UserRole.FUNCIONARIO
      };

      mockUserRepository.findOne.mockResolvedValue({ id: 'existing-id' });

      await userController.create(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Email já cadastrado'
      });
    });

    it('should return 400 when role is invalid', async () => {
      mockRequest.user = {
        id: 'admin-id',
        role: UserRole.ADMIN_MASTER
      };
      mockRequest.body = {
        nome: 'New User',
        email: 'new@example.com',
        senha: 'password123',
        role: 'INVALID_ROLE'
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await userController.create(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Role inválido'
      });
    });

    it('should return 400 when squadId missing for non-ADMIN_MASTER', async () => {
      mockRequest.user = {
        id: 'admin-id',
        role: UserRole.ADMIN_MASTER
      };
      mockRequest.body = {
        nome: 'New User',
        email: 'new@example.com',
        senha: 'password123',
        role: UserRole.FUNCIONARIO
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await userController.create(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Squad é obrigatório para este tipo de usuário'
      });
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      mockRequest.user = {
        id: 'admin-id',
        role: UserRole.ADMIN_MASTER
      };
      mockRequest.params = { id: 'user-1' };
      mockRequest.body = {
        nome: 'Updated Name'
      };

      const user = {
        id: 'user-1',
        nome: 'Old Name',
        email: 'user@example.com'
      };

      mockUserRepository.findOne
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce({ ...user, nome: 'Updated Name', senha: 'hashed' });
      mockUserRepository.save.mockResolvedValue({ ...user, nome: 'Updated Name' });

      await userController.update(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.objectContaining({ nome: 'Updated Name' })
      });
    });

    it('should return 404 when user not found', async () => {
      mockRequest.user = {
        id: 'admin-id',
        role: UserRole.ADMIN_MASTER
      };
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { nome: 'Updated' };

      mockUserRepository.findOne.mockResolvedValue(null);

      await userController.update(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    });

    it('should return 403 when non-admin tries to update other user', async () => {
      mockRequest.user = {
        id: 'user-1',
        role: UserRole.FUNCIONARIO
      };
      mockRequest.params = { id: 'user-2' };
      mockRequest.body = { nome: 'Updated' };

      const user = { id: 'user-2', nome: 'User 2' };
      mockUserRepository.findOne.mockResolvedValue(user);

      await userController.update(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Acesso negado'
      });
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      mockRequest.user = {
        id: 'admin-id',
        role: UserRole.ADMIN_MASTER
      };
      mockRequest.params = { id: 'user-1' };

      const user = {
        id: 'user-1',
        role: UserRole.FUNCIONARIO
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.remove.mockResolvedValue(user);

      await userController.delete(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Usuário excluído com sucesso'
      });
    });

    it('should return 400 when trying to delete ADMIN_MASTER', async () => {
      mockRequest.user = {
        id: 'admin-id',
        role: UserRole.ADMIN_MASTER
      };
      mockRequest.params = { id: 'admin-2' };

      const user = {
        id: 'admin-2',
        role: UserRole.ADMIN_MASTER
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      await userController.delete(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Não é possível excluir usuários Admin Master'
      });
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      mockRequest.body = {
        email: 'user@example.com',
        senha: 'password123'
      };

      const user = {
        id: 'user-id',
        email: 'user@example.com',
        senha: 'hashed-password',
        ativo: true
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token');

      await userController.login(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.objectContaining({
          token: 'jwt-token'
        })
      });
    });

    it('should return 400 when email is missing', async () => {
      mockRequest.body = {
        senha: 'password123'
      };

      await userController.login(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Email é obrigatório'
      });
    });

    it('should return 401 when credentials are invalid', async () => {
      mockRequest.body = {
        email: 'user@example.com',
        senha: 'wrongpassword'
      };

      const user = {
        id: 'user-id',
        senha: 'hashed-password',
        ativo: true
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await userController.login(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Email ou senha incorretos'
      });
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully for own user', async () => {
      mockRequest.user = {
        id: 'user-id',
        role: UserRole.FUNCIONARIO
      };
      mockRequest.params = { id: 'user-id' };
      mockRequest.body = {
        senhaAtual: 'oldpassword',
        novaSenha: 'newpassword123'
      };

      const user = {
        id: 'user-id',
        senha: 'hashed-old-password'
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password');
      mockUserRepository.save.mockResolvedValue(user);

      await userController.updatePassword(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Senha atualizada com sucesso'
      });
    });

    it('should return 400 when new password is too short', async () => {
      mockRequest.user = {
        id: 'user-id',
        role: UserRole.FUNCIONARIO
      };
      mockRequest.params = { id: 'user-id' };
      mockRequest.body = {
        senhaAtual: 'oldpassword',
        novaSenha: '123'
      };

      await userController.updatePassword(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Nova senha deve ter pelo menos 6 caracteres'
      });
    });

    it('should return 400 when current password is incorrect', async () => {
      mockRequest.user = {
        id: 'user-id',
        role: UserRole.FUNCIONARIO
      };
      mockRequest.params = { id: 'user-id' };
      mockRequest.body = {
        senhaAtual: 'wrongpassword',
        novaSenha: 'newpassword123'
      };

      const user = {
        id: 'user-id',
        senha: 'hashed-password'
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await userController.updatePassword(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Senha atual incorreta'
      });
    });
  });
});
