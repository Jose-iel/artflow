import { requireRole } from '../../middlewares/auth';
import { UserRole } from '../../entities/User';
import { Response, NextFunction } from 'express';

describe('requireRole Middleware', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mocks
    mockRequest = {
      cliente: undefined
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  describe('when user is not authenticated', () => {
    it('should return 401 when cliente is undefined', async () => {
      // Arrange
      const middleware = requireRole([UserRole.ADMIN_MASTER]);

      // Act
      await middleware(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Usuário não autenticado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when cliente is null', async () => {
      // Arrange
      mockRequest.cliente = null;
      const middleware = requireRole([UserRole.ADMIN_MASTER]);

      // Act
      await middleware(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Usuário não autenticado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when user is authenticated', () => {
    it('should allow access when user has required role', async () => {
      // Arrange
      mockRequest.cliente = {
        id: 'admin-id',
        email: 'admin@test.com',
        role: UserRole.ADMIN_MASTER
      };
      const middleware = requireRole([UserRole.ADMIN_MASTER]);

      // Act
      await middleware(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow access when user role is in allowed roles array', async () => {
      // Arrange
      mockRequest.cliente = {
        id: 'admin-id',
        email: 'admin@test.com',
        role: UserRole.ADMIN_MASTER
      };
      const middleware = requireRole([UserRole.CLIENT, UserRole.ADMIN_MASTER]);

      // Act
      await middleware(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access when user does not have required role', async () => {
      // Arrange
      mockRequest.cliente = {
        id: 'client-id',
        email: 'client@test.com',
        role: UserRole.CLIENT
      };
      const middleware = requireRole([UserRole.ADMIN_MASTER]);

      // Act
      await middleware(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Acesso negado - permissão insuficiente'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when client tries to access admin endpoint', async () => {
      // Arrange
      mockRequest.cliente = {
        id: 'client-id',
        email: 'client@test.com',
        role: UserRole.CLIENT
      };
      const middleware = requireRole([UserRole.ADMIN_MASTER]);

      // Act
      await middleware(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Acesso negado - permissão insuficiente'
      });
    });

    it('should deny access when super-user tries to access client-only endpoint', async () => {
      // Arrange
      mockRequest.cliente = {
        id: 'admin-id',
        email: 'admin@test.com',
        role: UserRole.ADMIN_MASTER
      };
      const middleware = requireRole([UserRole.CLIENT]);

      // Act
      await middleware(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Acesso negado - permissão insuficiente'
      });
    });
  });

  describe('multiple allowed roles', () => {
    it('should allow CLIENT role when both CLIENT and ADMIN_MASTER are allowed', async () => {
      // Arrange
      mockRequest.cliente = {
        id: 'client-id',
        email: 'client@test.com',
        role: UserRole.CLIENT
      };
      const middleware = requireRole([UserRole.CLIENT, UserRole.ADMIN_MASTER]);

      // Act
      await middleware(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow ADMIN_MASTER role when both CLIENT and ADMIN_MASTER are allowed', async () => {
      // Arrange
      mockRequest.cliente = {
        id: 'admin-id',
        email: 'admin@test.com',
        role: UserRole.ADMIN_MASTER
      };
      const middleware = requireRole([UserRole.CLIENT, UserRole.ADMIN_MASTER]);

      // Act
      await middleware(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty allowed roles array', async () => {
      // Arrange
      mockRequest.cliente = {
        id: 'user-id',
        email: 'user@test.com',
        role: UserRole.CLIENT
      };
      const middleware = requireRole([]);

      // Act
      await middleware(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Acesso negado - permissão insuficiente'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle undefined role in cliente object', async () => {
      // Arrange
      mockRequest.cliente = {
        id: 'user-id',
        email: 'user@test.com',
        role: undefined
      };
      const middleware = requireRole([UserRole.CLIENT]);

      // Act
      await middleware(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Acesso negado - permissão insuficiente'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
