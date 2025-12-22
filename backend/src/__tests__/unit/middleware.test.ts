import { authenticateToken } from '../../middlewares/auth';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../../config/data-source';
import { Cliente } from '../../entities/Cliente';
import { User, UserRole } from '../../entities/User';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../config/data-source');

describe('Auth Middleware', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mocks
    mockRequest = {
      headers: {},
      user: undefined
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();

    // Mock environment variables
    process.env.JWT_SECRET = 'test-secret';
    
    // Mock database repository
    const mockClienteRepository = {
      findOne: jest.fn()
    };
    const mockUserRepository = {
      findOne: jest.fn()
    };
    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === Cliente) return mockClienteRepository;
      if (entity === User) return mockUserRepository;
      return mockClienteRepository;
    });
  });

  describe('authenticateToken', () => {
    it('should return 401 when authorization header is missing', async () => {
      // Arrange
      delete mockRequest.headers.authorization;

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Token de autenticação não fornecido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header has invalid format', async () => {
      // Arrange
      mockRequest.headers.authorization = 'InvalidFormat';

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Token de autenticação não fornecido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 when JWT_SECRET is not configured', async () => {
      // Arrange
      delete process.env.JWT_SECRET;
      mockRequest.headers.authorization = 'Bearer valid-token';

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'JWT secret não configurado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when JWT verification fails (invalid token)', async () => {
      // Arrange
      mockRequest.headers.authorization = 'Bearer invalid-token';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'test-secret');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Token inválido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when JWT verification fails (expired token)', async () => {
      // Arrange
      mockRequest.headers.authorization = 'Bearer expired-token';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Token expired'); // TokenExpiredError extends JsonWebTokenError
      });

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('expired-token', 'test-secret');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Token inválido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not found in database', async () => {
      // Arrange
      mockRequest.headers.authorization = 'Bearer valid-token';
      const decodedToken = { id: 'user-id', email: 'test@example.com', type: 'user' };
      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      
      const mockUserRepository = AppDataSource.getRepository(User);
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id', ativo: true },
        relations: ['squad', 'squad.empresa']
      });
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Usuário não encontrado ou inativo'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 on unexpected error during authentication', async () => {
      // Arrange
      mockRequest.headers.authorization = 'Bearer valid-token';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Erro na autenticação'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should authenticate successfully and attach user to request', async () => {
      // Arrange
      mockRequest.headers.authorization = 'Bearer valid-token';
      const decodedToken = { id: 'user-id', email: 'test@example.com', type: 'user' };
      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      
      const activeUser = { 
        id: 'user-id', 
        email: 'test@example.com', 
        ativo: true,
        role: UserRole.ADMIN_MASTER,
        squad: { id: 'squad-id', empresa: { id: 'empresa-id' } }
      };
      const mockUserRepository = AppDataSource.getRepository(User);
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(activeUser);

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id', ativo: true },
        relations: ['squad', 'squad.empresa']
      });
      expect(mockRequest.user).toEqual({
        id: 'user-id',
        email: 'test@example.com',
        role: UserRole.ADMIN_MASTER,
        squadId: 'squad-id',
        empresaId: 'empresa-id'
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      mockRequest.headers.authorization = 'Bearer valid-token';
      const decodedToken = { id: 'user-id', email: 'test@example.com', type: 'user' };
      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      
      const mockUserRepository = AppDataSource.getRepository(User);
      (mockUserRepository.findOne as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Erro na autenticação'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should authenticate legacy cliente type successfully', async () => {
      // Arrange
      mockRequest.headers.authorization = 'Bearer valid-token';
      const decodedToken = { id: 'cliente-id', email: 'test@example.com', type: 'cliente' };
      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      
      const activeCliente = { 
        id: 'cliente-id', 
        email: 'test@example.com', 
        ativo: true,
        squad: { id: 'squad-id', empresa: { id: 'empresa-id' } }
      };
      const mockClienteRepository = AppDataSource.getRepository(Cliente);
      (mockClienteRepository.findOne as jest.Mock).mockResolvedValue(activeCliente);

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(mockClienteRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cliente-id', ativo: true },
        relations: ['squad', 'squad.empresa']
      });
      expect(mockRequest.user).toEqual({
        id: 'cliente-id',
        email: 'test@example.com',
        role: UserRole.CLIENT,
        squadId: 'squad-id',
        empresaId: 'empresa-id'
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should work with Bearer token in different casing', async () => {
      // Arrange
      mockRequest.headers.authorization = 'bearer valid-token';
      const decodedToken = { id: 'user-id', email: 'test@example.com', type: 'user' };
      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      
      const activeUser = { 
        id: 'user-id', 
        email: 'test@example.com', 
        ativo: true,
        role: UserRole.CLIENT
      };
      const mockUserRepository = AppDataSource.getRepository(User);
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(activeUser);

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id', ativo: true },
        relations: ['squad', 'squad.empresa']
      });
      expect(mockRequest.user).toEqual({
        id: 'user-id',
        email: 'test@example.com',
        role: UserRole.CLIENT,
        squadId: undefined,
        empresaId: undefined
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });  

    it('should handle empty token string', async () => {
      // Arrange
      mockRequest.headers.authorization = 'Bearer ';

      // Act
      await authenticateToken(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Token de autenticação não fornecido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
