import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source';
import { Cliente } from '../entities/Cliente';
import { User, UserRole } from '../entities/User';
import { AuthenticatedRequest } from './permissions';

// Legacy interface for backward compatibility
export interface AuthRequest extends Request {
  cliente?: Cliente;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    squadId?: string;
    empresaId?: string;
  };
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Token de autenticação não fornecido'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        status: 'error',
        message: 'JWT secret não configurado'
      });
    }

    const decoded = jwt.verify(token, jwtSecret) as { id: string; email: string; type: 'user' | 'cliente' };
    
    // Try to find as User first, then as Cliente for backward compatibility
    let authenticatedUser = null;
    
    if (decoded.type === 'user') {
      const userRepository = AppDataSource.getRepository(User);
      authenticatedUser = await userRepository.findOne({ 
        where: { id: decoded.id, ativo: true },
        relations: ['squad', 'squad.empresa']
      });
      
      if (authenticatedUser) {
        req.user = {
          id: authenticatedUser.id,
          email: authenticatedUser.email,
          role: authenticatedUser.role,
          squadId: authenticatedUser.squad?.id,
          empresaId: authenticatedUser.squad?.empresa?.id
        };
      }
    } else {
      // Legacy support for Cliente
      const clienteRepository = AppDataSource.getRepository(Cliente);
      const cliente = await clienteRepository.findOne({ 
        where: { id: decoded.id, ativo: true },
        relations: ['squad', 'squad.empresa']
      });

      if (cliente) {
        req.user = {
          id: cliente.id,
          email: cliente.email,
          role: UserRole.CLIENT,
          squadId: cliente.squad?.id,
          empresaId: cliente.squad?.empresa?.id
        };
      }
    }

    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Usuário não encontrado ou inativo'
      });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        status: 'error',
        message: 'Token inválido'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Erro na autenticação'
    });
  }
};

export const authenticateCliente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Token de autenticação não fornecido'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        status: 'error',
        message: 'JWT secret não configurado'
      });
    }

    const decoded = jwt.verify(token, jwtSecret) as { id: string; email: string };
    
    // Legacy support for Cliente
    const clienteRepository = AppDataSource.getRepository(Cliente);
    const cliente = await clienteRepository.findOne({ 
      where: { id: decoded.id, ativo: true },
      relations: ['squad', 'squad.empresa']
    });

    if (!cliente) {
      return res.status(401).json({
        status: 'error',
        message: 'Cliente não encontrado ou inativo'
      });
    }

    (req as any).cliente = {
      id: cliente.id,
      email: cliente.email,
      squadId: cliente.squad?.id,
      empresaId: cliente.squad?.empresa?.id
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        status: 'error',
        message: 'Token inválido'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Erro na autenticação'
    });
  }
};

// Legacy role-based middleware for backward compatibility
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const cliente = (req as any).cliente;
    
    if (!cliente) {
      return res.status(401).json({
        status: 'error',
        message: 'Usuário não autenticado'
      });
    }

    if (!allowedRoles.includes(cliente.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Acesso negado - permissão insuficiente'
      });
    }

    next();
  };
};

export type { AuthenticatedRequest };
