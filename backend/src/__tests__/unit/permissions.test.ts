import { Request, Response, NextFunction } from 'express';
import { requireAdminMaster, requireFuncionarioOrAdmin, canAccessUser, requireSameSquad } from '../../middlewares/permissions';
import { UserRole } from '../../entities/User';
import { AuthenticatedRequest } from '../../middlewares/permissions';
import AppError from '../../utils/AppError';

describe('Permissions Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      user: {
        id: 'user-id',
        email: 'user@test.com',
        role: UserRole.CLIENT,
        squadId: 'squad-id'
      }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  describe('requireAdminMaster', () => {
    it('should allow access for admin master', () => {
      mockRequest.user!.role = UserRole.ADMIN_MASTER;

      requireAdminMaster(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for funcionário', () => {
      mockRequest.user!.role = UserRole.FUNCIONARIO;

      requireAdminMaster(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Permissão insuficiente'
        })
      );
    });

    it('should deny access for cliente', () => {
      mockRequest.user!.role = UserRole.CLIENT;

      requireAdminMaster(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Permissão insuficiente'
        })
      );
    });
  });

  describe('requireFuncionarioOrAdmin', () => {
    it('should allow access for admin master', () => {
      mockRequest.user!.role = UserRole.ADMIN_MASTER;

      requireFuncionarioOrAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow access for funcionário', () => {
      mockRequest.user!.role = UserRole.FUNCIONARIO;

      requireFuncionarioOrAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should deny access for cliente', () => {
      mockRequest.user!.role = UserRole.CLIENT;

      requireFuncionarioOrAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Permissão insuficiente'
        })
      );
    });
  });

  describe('canAccessUser', () => {
    it('should allow admin master to access any user', () => {
      mockRequest.user!.role = UserRole.ADMIN_MASTER;
      mockRequest.params = { id: 'target-user-id' };

      canAccessUser(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow user to access own profile', () => {
      mockRequest.user!.role = UserRole.CLIENT;
      mockRequest.user!.id = 'user-id';
      mockRequest.params = { id: 'user-id' };

      canAccessUser(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should deny user from accessing other user profile', () => {
      mockRequest.user!.role = UserRole.CLIENT;
      mockRequest.user!.id = 'user-id';
      mockRequest.params = { id: 'other-user-id' };

      canAccessUser(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Acesso negado a dados de outro usuário'
        })
      );
    });

    it('should handle missing user ID in params', () => {
      mockRequest.user!.role = UserRole.CLIENT;
      mockRequest.params = {};

      canAccessUser(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // When no ID is provided, middleware allows access (no restriction)
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('requireSameSquad', () => {
    it('should allow admin master to access any squad', () => {
      mockRequest.user!.role = UserRole.ADMIN_MASTER;
      mockRequest.user!.squadId = 'admin-squad';
      mockRequest.params = { squadId: 'target-squad-id' };

      requireSameSquad(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow funcionário to access own squad', () => {
      mockRequest.user!.role = UserRole.FUNCIONARIO;
      mockRequest.user!.squadId = 'squad-id';
      mockRequest.params = { squadId: 'squad-id' };

      requireSameSquad(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow cliente to access own squad', () => {
      mockRequest.user!.role = UserRole.CLIENT;
      mockRequest.user!.squadId = 'squad-id';
      mockRequest.params = { squadId: 'squad-id' };

      requireSameSquad(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should deny funcionário from accessing other squad', () => {
      mockRequest.user!.role = UserRole.FUNCIONARIO;
      mockRequest.user!.squadId = 'squad-id';
      mockRequest.params = { squadId: 'other-squad-id' };

      requireSameSquad(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Acesso negado a squad diferente'
        })
      );
    });

    it('should deny cliente from accessing other squad', () => {
      mockRequest.user!.role = UserRole.CLIENT;
      mockRequest.user!.squadId = 'squad-id';
      mockRequest.params = { squadId: 'other-squad-id' };

      requireSameSquad(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Acesso negado a squad diferente'
        })
      );
    });

    it('should handle missing squad ID in params', () => {
      mockRequest.user!.role = UserRole.FUNCIONARIO;
      mockRequest.params = {};
      mockRequest.body = {};
      mockRequest.query = {};

      requireSameSquad(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // When no squadId is provided, middleware allows access (no restriction)
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle user without squad', () => {
      mockRequest.user!.role = UserRole.CLIENT;
      mockRequest.user!.squadId = undefined;
      mockRequest.params = { squadId: 'squad-id' };

      requireSameSquad(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Acesso negado a squad diferente'
        })
      );
    });
  });
});
