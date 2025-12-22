import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Empresa } from '../entities/Empresa';
import { Squad } from '../entities/Squad';
import { AuthenticatedRequest } from '../middlewares/permissions';
import { requireAdminMaster } from '../middlewares/permissions';

export class EmpresaController {
  private empresaRepository = AppDataSource.getRepository(Empresa);
  private squadRepository = AppDataSource.getRepository(Squad);

  // List all empresas (Admin Master only)
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const empresas = await this.empresaRepository.find({
        relations: ['squads'],
        order: { criadoEm: 'DESC' }
      });

      res.json({
        status: 'success',
        data: empresas
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar empresas'
      });
    }
  }

  // Get empresa by ID (Admin Master only)
  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const empresa = await this.empresaRepository.findOne({
        where: { id },
        relations: ['squads', 'squads.funcionarios', 'squads.clientes']
      });

      if (!empresa) {
        return res.status(404).json({
          status: 'error',
          message: 'Empresa não encontrada'
        });
      }

      res.json({
        status: 'success',
        data: empresa
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar empresa'
      });
    }
  }

  // Create new empresa (Admin Master only)
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { nome, cnpj, descricao } = req.body;

      // Check if CNPJ already exists
      const existingEmpresa = await this.empresaRepository.findOne({
        where: { cnpj }
      });

      if (existingEmpresa) {
        return res.status(400).json({
          status: 'error',
          message: 'CNPJ já cadastrado'
        });
      }

      const empresa = this.empresaRepository.create({
        nome,
        cnpj,
        descricao
      });

      const savedEmpresa = await this.empresaRepository.save(empresa);

      res.status(201).json({
        status: 'success',
        data: savedEmpresa
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao criar empresa'
      });
    }
  }

  // Update empresa (Admin Master only)
  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { nome, cnpj, descricao, ativo } = req.body;

      const empresa = await this.empresaRepository.findOne({ where: { id } });

      if (!empresa) {
        return res.status(404).json({
          status: 'error',
          message: 'Empresa não encontrada'
        });
      }

      // Check if CNPJ is being changed and if it already exists
      if (cnpj && cnpj !== empresa.cnpj) {
        const existingEmpresa = await this.empresaRepository.findOne({
          where: { cnpj }
        });

        if (existingEmpresa) {
          return res.status(400).json({
            status: 'error',
            message: 'CNPJ já cadastrado'
          });
        }
      }

      // Only update fields that are provided
      if (nome !== undefined) empresa.nome = nome;
      if (cnpj !== undefined) empresa.cnpj = cnpj;
      if (descricao !== undefined) empresa.descricao = descricao;
      if (ativo !== undefined) empresa.ativo = ativo;
      
      const updatedEmpresa = await this.empresaRepository.save(empresa);

      res.json({
        status: 'success',
        data: updatedEmpresa
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao atualizar empresa'
      });
    }
  }

  // Delete empresa (Admin Master only)
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const empresa = await this.empresaRepository.findOne({
        where: { id },
        relations: ['squads']
      });

      if (!empresa) {
        return res.status(404).json({
          status: 'error',
          message: 'Empresa não encontrada'
        });
      }

      // Check if empresa has squads
      if (empresa.squads.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Não é possível excluir empresa que possui squads'
        });
      }

      await this.empresaRepository.remove(empresa);

      res.json({
        status: 'success',
        message: 'Empresa excluída com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao excluir empresa'
      });
    }
  }

  // Get empresa statistics (Admin Master only)
  async getStatistics(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const empresa = await this.empresaRepository.findOne({
        where: { id },
        relations: ['squads']
      });

      if (!empresa) {
        return res.status(404).json({
          status: 'error',
          message: 'Empresa não encontrada'
        });
      }

      const squadIds = empresa.squads.map(squad => squad.id);

      // Count users and clients in all squads
      const [totalFuncionarios, totalClientes] = await Promise.all([
        this.squadRepository
          .createQueryBuilder('squad')
          .leftJoin('squad.funcionarios', 'funcionario')
          .where('squad.id IN (:...squadIds)', { squadIds })
          .select('COUNT(funcionario.id)', 'count')
          .getRawOne(),
        
        this.squadRepository
          .createQueryBuilder('squad')
          .leftJoin('squad.clientes', 'cliente')
          .where('squad.id IN (:...squadIds)', { squadIds })
          .select('COUNT(cliente.id)', 'count')
          .getRawOne()
      ]);

      res.json({
        status: 'success',
        data: {
          empresa: {
            id: empresa.id,
            nome: empresa.nome,
            totalSquads: empresa.squads.length,
            totalFuncionarios: parseInt(totalFuncionarios.count) || 0,
            totalClientes: parseInt(totalClientes.count) || 0
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar estatísticas da empresa'
      });
    }
  }
}
