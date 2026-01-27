import { AuthController } from '../../../controllers/auth.controller';
import { AppDataSource } from '../../../config/data-source';
import { Cliente } from '../../../entities/Cliente';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../../../config/data-source');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthController', () => {
  let authController: AuthController;
  let mockRequest: any;
  let mockResponse: any;
  let mockClienteRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    authController = new AuthController();
    
    mockRequest = {
      body: {},
      params: {},
      cliente: undefined
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockClienteRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn()
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockClienteRepository);
    
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  describe('register', () => {
    it('should register new cliente successfully', async () => {
      mockRequest.body = {
        nome: 'Test User',
        email: 'test@example.com',
        senha: 'password123'
      };

      const hashedPassword = 'hashed-password';
      const newCliente = {
        id: 'cliente-id',
        nome: 'Test User',
        email: 'test@example.com',
        senha: hashedPassword,
        ativo: true,
        criadoEm: new Date(),
        atualizadoEm: new Date()
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockClienteRepository.findOne.mockResolvedValue(null);
      mockClienteRepository.create.mockReturnValue(newCliente);
      mockClienteRepository.save.mockResolvedValue(newCliente);
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token');

      await authController.register(mockRequest, mockResponse);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 8);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Cliente criado com sucesso',
          token: 'jwt-token',
          cliente: expect.objectContaining({
            id: 'cliente-id',
            email: 'test@example.com'
          })
        })
      );
    });

    it('should return 400 when nome is empty', async () => {
      mockRequest.body = {
        nome: '',
        email: 'test@example.com',
        senha: 'password123'
      };

      await authController.register(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Nome é obrigatório'
      });
    });

    it('should return 400 when email is invalid', async () => {
      mockRequest.body = {
        nome: 'Test User',
        email: 'invalid-email',
        senha: 'password123'
      };

      await authController.register(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'email inválido'
      });
    });

    it('should return 400 when senha is too short', async () => {
      mockRequest.body = {
        nome: 'Test User',
        email: 'test@example.com',
        senha: '123'
      };

      await authController.register(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Senha deve ter pelo menos 8 caracteres'
      });
    });

    it('should return 400 when email already exists', async () => {
      mockRequest.body = {
        nome: 'Test User',
        email: 'existing@example.com',
        senha: 'password123'
      };

      mockClienteRepository.findOne.mockResolvedValue({ id: 'existing-id' });

      await authController.register(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Email já cadastrado'
      });
    });

    it('should convert email to lowercase', async () => {
      mockRequest.body = {
        nome: 'Test User',
        email: 'TEST@EXAMPLE.COM',
        senha: 'password123'
      };

      mockClienteRepository.findOne.mockResolvedValue(null);
      mockClienteRepository.create.mockReturnValue({});
      mockClienteRepository.save.mockResolvedValue({
        id: 'id',
        email: 'test@example.com',
        criadoEm: new Date(),
        atualizadoEm: new Date()
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      (jwt.sign as jest.Mock).mockReturnValue('token');

      await authController.register(mockRequest, mockResponse);

      expect(mockClienteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com'
        })
      );
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        senha: 'password123'
      };

      const cliente = {
        id: 'cliente-id',
        nome: 'Test User',
        email: 'test@example.com',
        senha: 'hashed-password',
        ativo: true,
        criadoEm: new Date(),
        atualizadoEm: new Date()
      };

      mockClienteRepository.findOne.mockResolvedValue(cliente);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token');

      await authController.login(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login realizado com sucesso',
          token: 'jwt-token'
        })
      );
    });

    it('should return 400 when email is missing', async () => {
      mockRequest.body = {
        senha: 'password123'
      };

      await authController.login(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Email é obrigatório'
      });
    });

    it('should return 400 when senha is missing', async () => {
      mockRequest.body = {
        email: 'test@example.com'
      };

      await authController.login(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Senha é obrigatória'
      });
    });

    it('should return 401 when cliente not found', async () => {
      mockRequest.body = {
        email: 'nonexistent@example.com',
        senha: 'password123'
      };

      mockClienteRepository.findOne.mockResolvedValue(null);

      await authController.login(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Credenciais inválidas'
      });
    });

    it('should return 401 when password is incorrect', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        senha: 'wrongpassword'
      };

      const cliente = {
        id: 'cliente-id',
        email: 'test@example.com',
        senha: 'hashed-password',
        ativo: true
      };

      mockClienteRepository.findOne.mockResolvedValue(cliente);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await authController.login(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Credenciais inválidas'
      });
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      mockRequest.cliente = { id: 'cliente-id' };
      mockRequest.body = {
        nome: 'Updated Name'
      };

      const cliente = {
        id: 'cliente-id',
        nome: 'Old Name',
        email: 'test@example.com',
        ativo: true,
        atualizadoEm: new Date()
      };

      mockClienteRepository.findOne.mockResolvedValue(cliente);
      mockClienteRepository.save.mockResolvedValue({
        ...cliente,
        nome: 'Updated Name'
      });
      (jwt.sign as jest.Mock).mockReturnValue('new-token');

      await authController.updateProfile(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Perfil atualizado com sucesso',
          token: 'new-token'
        })
      );
    });

    it('should return 400 when nome is empty', async () => {
      mockRequest.cliente = { id: 'cliente-id' };
      mockRequest.body = {
        nome: ''
      };

      await authController.updateProfile(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Nome é obrigatório'
      });
    });

    it('should return 404 when cliente not found', async () => {
      mockRequest.cliente = { id: 'nonexistent-id' };
      mockRequest.body = {
        nome: 'Updated Name'
      };

      mockClienteRepository.findOne.mockResolvedValue(null);

      await authController.updateProfile(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockRequest.cliente = { id: 'cliente-id' };
      mockRequest.body = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      };

      const cliente = {
        id: 'cliente-id',
        senha: 'hashed-old-password',
        atualizadoEm: new Date()
      };

      mockClienteRepository.findOne.mockResolvedValue(cliente);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password');
      mockClienteRepository.save.mockResolvedValue(cliente);

      await authController.changePassword(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Senha alterada com sucesso'
      });
    });

    it('should return 400 when passwords are missing', async () => {
      mockRequest.cliente = { id: 'cliente-id' };
      mockRequest.body = {};

      await authController.changePassword(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Senha atual e nova senha são obrigatórias'
      });
    });

    it('should return 400 when new password is too short', async () => {
      mockRequest.cliente = { id: 'cliente-id' };
      mockRequest.body = {
        currentPassword: 'oldpassword',
        newPassword: '123'
      };

      await authController.changePassword(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'A nova senha deve ter pelo menos 6 caracteres'
      });
    });

    it('should return 400 when current password is incorrect', async () => {
      mockRequest.cliente = { id: 'cliente-id' };
      mockRequest.body = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      const cliente = {
        id: 'cliente-id',
        senha: 'hashed-password'
      };

      mockClienteRepository.findOne.mockResolvedValue(cliente);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await authController.changePassword(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Senha atual incorreta'
      });
    });
  });
});
