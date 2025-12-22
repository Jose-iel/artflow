import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { User, UserRole } from '../entities/User';
import { Squad } from '../entities/Squad';
import { AuthenticatedRequest } from '../middlewares/permissions';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class UserController {
  private userRepository = AppDataSource.getRepository(User);
  private squadRepository = AppDataSource.getRepository(Squad);

  // List users (Admin Master sees all, Funcionário sees from same squad)
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      let users;

      if (req.user?.role === UserRole.ADMIN_MASTER) {
        users = await this.userRepository.find({
          relations: ['squad', 'squad.empresa'],
          order: { criadoEm: 'DESC' }
        });
      } else if (req.user?.role === UserRole.FUNCIONARIO) {
        users = await this.userRepository.find({
          where: { squadId: req.user.squadId },
          relations: ['squad'],
          order: { criadoEm: 'DESC' }
        });
      } else {
        // Cliente only sees himself
        users = await this.userRepository.find({
          where: { id: req.user?.id },
          relations: ['squad'],
          order: { criadoEm: 'DESC' }
        });
      }

      // Remove passwords from response
      const usersWithoutPassword = users.map(user => {
        const { senha, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json({
        status: 'success',
        data: usersWithoutPassword
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar usuários'
      });
    }
  }

  // Get user by ID
  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['squad', 'squad.empresa']
      });

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Usuário não encontrado'
        });
      }

      // Check permissions
      if (req.user?.role === UserRole.FUNCIONARIO && user.squadId !== req.user.squadId) {
        return res.status(403).json({
          status: 'error',
          message: 'Acesso negado'
        });
      }

      if (req.user?.role === UserRole.CLIENT && user.id !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Acesso negado'
        });
      }

      const { senha, ...userWithoutPassword } = user;

      res.json({
        status: 'success',
        data: userWithoutPassword
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar usuário'
      });
    }
  }

  // Create new user (Admin Master only)
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { nome, email, senha, role, squadId } = req.body;

      // Check if email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Email já cadastrado'
        });
      }

      // Validate role
      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({
          status: 'error',
          message: 'Role inválido'
        });
      }

      // If not ADMIN_MASTER, squad is required
      if (role !== UserRole.ADMIN_MASTER && !squadId) {
        return res.status(400).json({
          status: 'error',
          message: 'Squad é obrigatório para este tipo de usuário'
        });
      }

      // Validate squad exists
      if (squadId) {
        const squad = await this.squadRepository.findOne({
          where: { id: squadId }
        });

        if (!squad) {
          return res.status(404).json({
            status: 'error',
            message: 'Squad não encontrada'
          });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(senha, 10);

      const user = this.userRepository.create({
        nome,
        email,
        senha: hashedPassword,
        role,
        squadId: role === UserRole.ADMIN_MASTER ? null : squadId
      });

      const savedUser = await this.userRepository.save(user);

      const userWithRelations = await this.userRepository.findOne({
        where: { id: savedUser.id },
        relations: ['squad', 'squad.empresa']
      });

      const { senha: _, ...userWithoutPassword } = userWithRelations!;

      res.status(201).json({
        status: 'success',
        data: userWithoutPassword
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao criar usuário'
      });
    }
  }

  // Update user (Admin Master or own user)
  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { nome, email, role, squadId, ativo } = req.body;

      const user = await this.userRepository.findOne({
        where: { id }
      });

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Usuário não encontrado'
        });
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN_MASTER && user.id !== req.user!.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Acesso negado'
        });
      }

      // Only Admin Master can change role, squad and ativo
      if (req.user!.role !== UserRole.ADMIN_MASTER) {
        if (role !== undefined || squadId !== undefined || ativo !== undefined) {
          return res.status(403).json({
            status: 'error',
            message: 'Apenas Admin Master pode alterar role, squad ou status'
          });
        }
      }

      // Check if email is being changed and if it already exists
      if (email && email !== user.email) {
        const existingUser = await this.userRepository.findOne({
          where: { email }
        });

        if (existingUser) {
          return res.status(400).json({
            status: 'error',
            message: 'Email já cadastrado'
          });
        }
      }

      // Validate squad if being changed
      if (squadId !== undefined && squadId !== null) {
        const squad = await this.squadRepository.findOne({
          where: { id: squadId }
        });

        if (!squad) {
          return res.status(404).json({
            status: 'error',
            message: 'Squad não encontrada'
          });
        }
      }

      // Only update fields that are provided
      if (nome !== undefined) user.nome = nome;
      if (email !== undefined) user.email = email;
      if (role !== undefined) user.role = role;
      if (squadId !== undefined) user.squadId = squadId;
      if (ativo !== undefined) user.ativo = ativo;
      
      const updatedUser = await this.userRepository.save(user);

      const userWithRelations = await this.userRepository.findOne({
        where: { id: updatedUser.id },
        relations: ['squad', 'squad.empresa']
      });

      const { senha: _, ...userWithoutPassword } = userWithRelations!;

      res.json({
        status: 'success',
        data: userWithoutPassword
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao atualizar usuário'
      });
    }
  }

  // Delete user (Admin Master only)
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Usuário não encontrado'
        });
      }

      // Prevent deleting admin master users
      if (user.role === UserRole.ADMIN_MASTER) {
        return res.status(400).json({
          status: 'error',
          message: 'Não é possível excluir usuários Admin Master'
        });
      }

      await this.userRepository.remove(user);

      res.json({
        status: 'success',
        message: 'Usuário excluído com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao excluir usuário'
      });
    }
  }

  // Update password (own user or Admin Master)
  async updatePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { senhaAtual, novaSenha } = req.body;

      if (!novaSenha || novaSenha.length < 6) {
        return res.status(400).json({
          status: 'error',
          message: 'Nova senha deve ter pelo menos 6 caracteres'
        });
      }

      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Usuário não encontrado'
        });
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN_MASTER && user.id !== req.user!.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Acesso negado'
        });
      }

      // If not Admin Master, verify current password
      if (req.user!.role !== UserRole.ADMIN_MASTER) {
        const isPasswordValid = await bcrypt.compare(senhaAtual, user.senha);
        if (!isPasswordValid) {
          return res.status(400).json({
            status: 'error',
            message: 'Senha atual incorreta'
          });
        }
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(novaSenha, 10);
      user.senha = hashedPassword;
      await this.userRepository.save(user);

      res.json({
        status: 'success',
        message: 'Senha atualizada com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao atualizar senha'
      });
    }
  }

  // User login
  async login(req: Request, res: Response) {
    try {
      const { email, senha } = req.body;

      // Validation
      if (!email || !email.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Email é obrigatório'
        });
      }

      if (!senha || !senha.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Senha é obrigatória'
        });
      }

      const user = await this.userRepository.findOne({
        where: { email, ativo: true },
        relations: ['squad', 'squad.empresa']
      });

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Email ou senha incorretos'
        });
      }

      const isPasswordValid = await bcrypt.compare(senha, user.senha);
      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Email ou senha incorretos'
        });
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return res.status(500).json({
          status: 'error',
          message: 'JWT secret não configurado'
        });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          type: 'user' 
        },
        jwtSecret,
        { expiresIn: '24h' }
      );

      const { senha: _, ...userWithoutPassword } = user;

      res.json({
        status: 'success',
        data: {
          user: userWithoutPassword,
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro no login'
      });
    }
  }
}
