import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';
import { UserRole } from '../entities/User';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    squadId?: string;
    empresaId?: string;
  };
}

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Usuário não autenticado', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Permissão insuficiente', 403));
    }

    next();
  };
};

export const requireAdminMaster = requireRole([UserRole.ADMIN_MASTER]);

export const requireFuncionarioOrAdmin = requireRole([UserRole.ADMIN_MASTER, UserRole.FUNCIONARIO]);

export const requireSameSquad = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Usuário não autenticado', 401));
  }

  // Admin Master pode acessar qualquer squad
  if (req.user.role === UserRole.ADMIN_MASTER) {
    return next();
  }

  // Funcionário só pode acessar sua própria squad
  if (req.user.role === UserRole.FUNCIONARIO) {
    const requestedSquadId = req.params.squadId || req.body.squadId || req.query.squadId;
    
    if (requestedSquadId && requestedSquadId !== req.user.squadId) {
      return next(new AppError('Acesso negado a squad diferente', 403));
    }
  }

  // Cliente só pode acessar sua própria squad
  if (req.user.role === UserRole.CLIENT) {
    const requestedSquadId = req.params.squadId || req.body.squadId || req.query.squadId;
    
    if (requestedSquadId && requestedSquadId !== req.user.squadId) {
      return next(new AppError('Acesso negado a squad diferente', 403));
    }
  }

  next();
};

export const requireSameEmpresa = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Usuário não autenticado', 401));
  }

  // Admin Master pode acessar qualquer empresa
  if (req.user.role === UserRole.ADMIN_MASTER) {
    return next();
  }

  // Outros roles só podem acessar sua própria empresa
  const requestedEmpresaId = req.params.empresaId || req.body.empresaId || req.query.empresaId;
  
  if (requestedEmpresaId && requestedEmpresaId !== req.user.empresaId) {
    return next(new AppError('Acesso negado a empresa diferente', 403));
  }

  next();
};

export const canAccessUser = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Usuário não autenticado', 401));
  }

  const targetUserId = req.params.userId || req.params.id;
  
  // Admin Master pode acessar qualquer usuário
  if (req.user.role === UserRole.ADMIN_MASTER) {
    return next();
  }

  // Usuário só pode acessar seus próprios dados
  if (targetUserId && targetUserId !== req.user.id) {
    return next(new AppError('Acesso negado a dados de outro usuário', 403));
  }

  next();
};

export const canAccessCliente = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Usuário não autenticado', 401));
  }

  // Admin Master pode acessar qualquer cliente
  if (req.user.role === UserRole.ADMIN_MASTER) {
    return next();
  }

  // Funcionário só pode acessar clientes da mesma squad
  if (req.user.role === UserRole.FUNCIONARIO) {
    // Verifica se o cliente pertence à mesma squad do funcionário
    // Isso será implementado no controller com a query no banco
    return next();
  }

  // Cliente só pode acessar seus próprios dados
  const targetClienteId = req.params.clienteId || req.params.id;
  if (req.user.role === UserRole.CLIENT && targetClienteId) {
    // Precisa verificar se o cliente ID corresponde ao ID do usuário logado
    // Isso será implementado no controller
  }

  next();
};
