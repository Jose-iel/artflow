import { requireRole } from '../../middlewares/permissions';
import { UserRole } from '../../entities/User';
import { Response, NextFunction } from 'express';
import AppError from '../../utils/AppError';

describe('requireRole Middleware', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      user: undefined
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  describe('when user is not authenticated', () => {
    it('should call next with error when user is undefined', () => {
      const middleware = requireRole([UserRole.ADMIN_MASTER]);

      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Usuário não autenticado'
        })
      );
    });

    it('should call next with error when user is null', () => {
      mockRequest.user = null;
      const middleware = requireRole([UserRole.ADMIN_MASTER]);

      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Usuário não autenticado'
        })
      );
    });
  });

  describe('when user is authenticated', () => {
    it('should allow access when user has required role', () => {
      mockRequest.user = {
        id: 'admin-id',
        email: 'admin@test.com',
        role: UserRole.ADMIN_MASTER
      };
      const middleware = requireRole([UserRole.ADMIN_MASTER]);

      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should allow access when user role is in allowed roles array', () => {
      mockRequest.user = {
        id: 'admin-id',
        email: 'admin@test.com',
        role: UserRole.ADMIN_MASTER
      };
      const middleware = requireRole([UserRole.CLIENT, UserRole.ADMIN_MASTER]);

      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should deny access when user does not have required role', () => {
      mockRequest.user = {
        id: 'client-id',
        email: 'client@test.com',
        role: UserRole.CLIENT
      };
      const middleware = requireRole([UserRole.ADMIN_MASTER]);

      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Permissão insuficiente'
        })
      );
    });

    it('should deny access when client tries to access admin endpoint', () => {
      mockRequest.user = {
        id: 'client-id',
        email: 'client@test.com',
        role: UserRole.CLIENT
      };
      const middleware = requireRole([UserRole.ADMIN_MASTER]);

      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Permissão insuficiente'
        })
      );
    });

    it('should deny access when admin tries to access client-only endpoint', () => {
      mockRequest.user = {
        id: 'admin-id',
        email: 'admin@test.com',
        role: UserRole.ADMIN_MASTER
      };
      const middleware = requireRole([UserRole.CLIENT]);

      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Permissão insuficiente'
        })
      );
    });
  });

  describe('multiple allowed roles', () => {
    it('should allow CLIENT role when both CLIENT and ADMIN_MASTER are allowed', () => {
      mockRequest.user = {
        id: 'client-id',
        email: 'client@test.com',
        role: UserRole.CLIENT
      };
      const middleware = requireRole([UserRole.CLIENT, UserRole.ADMIN_MASTER]);

      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should allow ADMIN_MASTER role when both CLIENT and ADMIN_MASTER are allowed', () => {
      mockRequest.user = {
        id: 'admin-id',
        email: 'admin@test.com',
        role: UserRole.ADMIN_MASTER
      };
      const middleware = requireRole([UserRole.CLIENT, UserRole.ADMIN_MASTER]);

      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('edge cases', () => {
    it('should handle empty allowed roles array', () => {
      mockRequest.user = {
        id: 'user-id',
        email: 'user@test.com',
        role: UserRole.CLIENT
      };
      const middleware = requireRole([]);

      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Permissão insuficiente'
        })
      );
    });

    it('should handle undefined role in user object', () => {
      mockRequest.user = {
        id: 'user-id',
        email: 'user@test.com',
        role: undefined as any
      };
      const middleware = requireRole([UserRole.CLIENT]);

      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Permissão insuficiente'
        })
      );
    });
  });
});
