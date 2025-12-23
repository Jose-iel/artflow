import { Response } from 'express';
import { ISquadService } from '../interfaces/squad-service.interface';
import { AuthenticatedRequest } from '../middlewares/permissions';
import { SquadMembersResponseDto } from '../dtos/response/squad-member.response.dto';
import { AddFuncionarioToSquadRequestDto } from '../dtos/request/add-funcionario-to-squad.request.dto';
import { AddClienteToSquadRequestDto } from '../dtos/request/add-cliente-to-squad.request.dto';

export class SquadController {
  constructor(private readonly squadService: ISquadService) {}

  async getAll(req: AuthenticatedRequest, res: Response) {
    const squads = await this.squadService.findAll(req.user!);

    res.json({
      status: 'success',
      data: squads
    });
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const squad = await this.squadService.findById(id, req.user!);

    res.json({
      status: 'success',
      data: squad
    });
  }

  async create(req: AuthenticatedRequest, res: Response) {
    const { nome, descricao, empresaId } = req.body;
    const squad = await this.squadService.create(nome, descricao, empresaId);

    res.status(201).json({
      status: 'success',
      data: squad
    });
  }

  async update(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { nome, descricao, ativo } = req.body;
    
    const squad = await this.squadService.update(id, { nome, descricao, ativo });

    res.json({
      status: 'success',
      data: squad
    });
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    await this.squadService.delete(id);

    res.json({
      status: 'success',
      message: 'Squad excluída com sucesso'
    });
  }

  // ═══════════════════════════════════════════════════════════
  // MEMBER MANAGEMENT ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  async addFuncionario(req: AuthenticatedRequest, res: Response) {
    const { id: squadId } = req.params;
    const dto = req.body as AddFuncionarioToSquadRequestDto;
    
    const funcionario = await this.squadService.addFuncionario(squadId, dto, req.user!);

    res.json({
      status: 'success',
      message: 'Funcionário adicionado à squad com sucesso',
      data: {
        squadId,
        usuarioId: funcionario.id,
        usuarioNome: funcionario.nome
      }
    });
  }

  async removeFuncionario(req: AuthenticatedRequest, res: Response) {
    const { id: squadId, usuarioId } = req.params;
    
    await this.squadService.removeFuncionario(squadId, usuarioId, req.user!);

    res.json({
      status: 'success',
      message: 'Funcionário removido da squad com sucesso'
    });
  }

  async addCliente(req: AuthenticatedRequest, res: Response) {
    const { id: squadId } = req.params;
    const dto = req.body as AddClienteToSquadRequestDto;
    
    const cliente = await this.squadService.addCliente(squadId, dto, req.user!);

    res.status(201).json({
      status: 'success',
      message: 'Cliente adicionado à squad com sucesso',
      data: {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        squadId: cliente.squadId
      }
    });
  }

  async removeCliente(req: AuthenticatedRequest, res: Response) {
    const { id: squadId, clienteId } = req.params;
    
    await this.squadService.removeCliente(squadId, clienteId, req.user!);

    res.json({
      status: 'success',
      message: 'Cliente removido da squad com sucesso'
    });
  }

  async getMembers(req: AuthenticatedRequest, res: Response) {
    const { id: squadId } = req.params;
    
    const members = await this.squadService.getMembers(squadId, req.user!);

    res.json({
      status: 'success',
      data: members
    });
  }

  async getStatistics(req: AuthenticatedRequest, res: Response) {
    const { id: squadId } = req.params;
    
    const members = await this.squadService.getMembers(squadId, req.user!);

    res.json({
      status: 'success',
      data: {
        squad: members.squad,
        totalFuncionarios: members.funcionarios.length,
        totalClientes: members.clientes.length
      }
    });
  }
}
