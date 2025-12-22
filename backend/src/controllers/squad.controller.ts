import { Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Squad } from '../entities/Squad';
import { Empresa } from '../entities/Empresa';
import { User, UserRole } from '../entities/User';
import { AuthenticatedRequest } from '../middlewares/permissions';

export class SquadController {
  private squadRepository = AppDataSource.getRepository(Squad);
  private empresaRepository = AppDataSource.getRepository(Empresa);
  private userRepository = AppDataSource.getRepository(User);

  // List squads (Admin Master sees all, Funcionário/Cliente sees only own squad)
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      let squads;

      if (req.user?.role === UserRole.ADMIN_MASTER) {
        squads = await this.squadRepository.find({
          relations: ['empresa', 'funcionarios', 'clientes'],
          order: { criadoEm: 'DESC' }
        });
      } else if (req.user?.role === UserRole.FUNCIONARIO) {
        // Funcionário only sees his own squad
        squads = await this.squadRepository.find({
          where: { id: req.user.squadId },
          relations: ['empresa', 'funcionarios', 'clientes'],
          order: { criadoEm: 'DESC' }
        });
      } else {
        // Cliente only sees his own squad
        squads = await this.squadRepository.find({
          where: { id: req.user?.squadId },
          relations: ['empresa'],
          order: { criadoEm: 'DESC' }
        });
      }

      res.json({
        status: 'success',
        data: squads
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar squads'
      });
    }
  }

  // Get squad by ID
  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const squad = await this.squadRepository.findOne({
        where: { id },
        relations: ['empresa', 'funcionarios', 'clientes']
      });

      if (!squad) {
        return res.status(404).json({
          status: 'error',
          message: 'Squad não encontrada'
        });
      }

      // Check permissions - Funcionário and Cliente can only access their own squad
      if (req.user?.role === UserRole.FUNCIONARIO && squad.id !== req.user.squadId) {
        return res.status(403).json({
          status: 'error',
          message: 'Acesso negado'
        });
      }

      if (req.user?.role === UserRole.CLIENT && squad.id !== req.user.squadId) {
        return res.status(403).json({
          status: 'error',
          message: 'Acesso negado'
        });
      }

      res.json({
        status: 'success',
        data: squad
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar squad'
      });
    }
  }

  // Create new squad (Admin Master only)
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { nome, descricao, empresaId } = req.body;

      const empresa = await this.empresaRepository.findOne({
        where: { id: empresaId }
      });

      if (!empresa) {
        return res.status(404).json({
          status: 'error',
          message: 'Empresa não encontrada'
        });
      }

      const squad = this.squadRepository.create({
        nome,
        descricao,
        empresaId
      });

      const savedSquad = await this.squadRepository.save(squad);

      const squadWithRelations = await this.squadRepository.findOne({
        where: { id: savedSquad.id },
        relations: ['empresa']
      });

      res.status(201).json({
        status: 'success',
        data: squadWithRelations
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao criar squad'
      });
    }
  }

  // Update squad (Admin Master only)
  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { nome, descricao, ativo } = req.body;

      const squad = await this.squadRepository.findOne({ where: { id } });

      if (!squad) {
        return res.status(404).json({
          status: 'error',
          message: 'Squad não encontrada'
        });
      }

      Object.assign(squad, { nome, descricao, ativo });
      const updatedSquad = await this.squadRepository.save(squad);

      const squadWithRelations = await this.squadRepository.findOne({
        where: { id: updatedSquad.id },
        relations: ['empresa']
      });

      res.json({
        status: 'success',
        data: squadWithRelations
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao atualizar squad'
      });
    }
  }

  // Delete squad (Admin Master only)
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const squad = await this.squadRepository.findOne({
        where: { id },
        relations: ['funcionarios', 'clientes']
      });

      if (!squad) {
        return res.status(404).json({
          status: 'error',
          message: 'Squad não encontrada'
        });
      }

      // Check if squad has users or clients
      if (squad.funcionarios.length > 0 || squad.clientes.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Não é possível excluir squad que possui funcionários ou clientes'
        });
      }

      await this.squadRepository.remove(squad);

      res.json({
        status: 'success',
        message: 'Squad excluída com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao excluir squad'
      });
    }
  }

  // Add funcionário to squad (Admin Master only)
  async addFuncionario(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { usuarioId } = req.body;

      const squad = await this.squadRepository.findOne({ where: { id } });
      if (!squad) {
        return res.status(404).json({
          status: 'error',
          message: 'Squad não encontrada'
        });
      }

      const usuario = await this.userRepository.findOne({ 
        where: { id: usuarioId, role: UserRole.FUNCIONARIO } 
      });
      if (!usuario) {
        return res.status(404).json({
          status: 'error',
          message: 'Funcionário não encontrado'
        });
      }

      usuario.squadId = squad.id;
      await this.userRepository.save(usuario);

      res.json({
        status: 'success',
        message: 'Funcionário adicionado à squad com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao adicionar funcionário à squad'
      });
    }
  }

  // Remove funcionário from squad (Admin Master only)
  async removeFuncionario(req: AuthenticatedRequest, res: Response) {
    try {
      const { id, usuarioId } = req.params;

      const squad = await this.squadRepository.findOne({ where: { id } });
      if (!squad) {
        return res.status(404).json({
          status: 'error',
          message: 'Squad não encontrada'
        });
      }

      const usuario = await this.userRepository.findOne({ 
        where: { id: usuarioId, squadId: squad.id } 
      });
      if (!usuario) {
        return res.status(404).json({
          status: 'error',
          message: 'Funcionário não encontrado nesta squad'
        });
      }

      usuario.squadId = null;
      await this.userRepository.save(usuario);

      res.json({
        status: 'success',
        message: 'Funcionário removido da squad com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao remover funcionário da squad'
      });
    }
  }

  // Get squad statistics
  async getStatistics(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const squad = await this.squadRepository.findOne({
        where: { id },
        relations: ['funcionarios', 'clientes', 'empresa']
      });

      if (!squad) {
        return res.status(404).json({
          status: 'error',
          message: 'Squad não encontrada'
        });
      }

      // Check permissions - Funcionário and Cliente can only access their own squad
      if (req.user?.role === UserRole.FUNCIONARIO && squad.id !== req.user.squadId) {
        return res.status(403).json({
          status: 'error',
          message: 'Acesso negado'
        });
      }

      if (req.user?.role === UserRole.CLIENT && squad.id !== req.user.squadId) {
        return res.status(403).json({
          status: 'error',
          message: 'Acesso negado'
        });
      }

      res.json({
        status: 'success',
        data: {
          squad: {
            id: squad.id,
            nome: squad.nome,
            empresa: squad.empresa,
            totalFuncionarios: squad.funcionarios.length,
            totalClientes: squad.clientes.length,
            ativo: squad.ativo
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar estatísticas da squad'
      });
    }
  }
}
