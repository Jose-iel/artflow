import bcrypt from 'bcryptjs';
import { Squad } from '../entities/Squad';
import { User, UserRole } from '../entities/User';
import { Cliente } from '../entities/Cliente';
import { ISquadService, AuthUser, SquadMembersResult } from '../interfaces/squad-service.interface';
import { ISquadRepository, IUserRepository, IClienteRepository, IEmpresaRepository } from '../interfaces/squad-repository.interface';
import { AddFuncionarioToSquadRequestDto } from '../dtos/request/add-funcionario-to-squad.request.dto';
import { AddClienteToSquadRequestDto } from '../dtos/request/add-cliente-to-squad.request.dto';
import AppError from '../utils/AppError';

export class SquadService implements ISquadService {
  constructor(
    private readonly squadRepository: ISquadRepository,
    private readonly userRepository: IUserRepository,
    private readonly clienteRepository: IClienteRepository,
    private readonly empresaRepository: IEmpresaRepository
  ) {}

  async findAll(user: AuthUser): Promise<Squad[]> {
    if (user.role === UserRole.ADMIN_MASTER) {
      return this.squadRepository.findAll();
    }

    // Funcionário e Cliente só veem sua própria squad
    if (!user.squadId) {
      return [];
    }

    const squad = await this.squadRepository.findByIdWithMembers(user.squadId);
    return squad ? [squad] : [];
  }

  async findById(id: string, user: AuthUser): Promise<Squad> {
    const squad = await this.squadRepository.findByIdWithMembers(id);

    if (!squad) {
      throw new AppError('Squad não encontrada', 404);
    }

    // Verifica permissão
    if (!this.canAccessSquad(user, squad.id)) {
      throw new AppError('Acesso negado', 403);
    }

    return squad;
  }

  async create(nome: string, descricao: string | undefined, empresaId: string): Promise<Squad> {
    // Validate empresa exists
    const empresa = await this.empresaRepository.findById(empresaId);
    if (!empresa) {
      throw new AppError('Empresa não encontrada', 404);
    }

    const squad = await this.squadRepository.save({
      nome,
      descricao,
      empresaId
    });

    return this.squadRepository.findByIdWithMembers(squad.id) as Promise<Squad>;
  }

  async update(id: string, data: Partial<Squad>): Promise<Squad> {
    const squad = await this.squadRepository.findById(id);

    if (!squad) {
      throw new AppError('Squad não encontrada', 404);
    }

    Object.assign(squad, data);
    await this.squadRepository.save(squad);

    return this.squadRepository.findByIdWithMembers(id) as Promise<Squad>;
  }

  async delete(id: string): Promise<void> {
    const squad = await this.squadRepository.findByIdWithMembers(id);

    if (!squad) {
      throw new AppError('Squad não encontrada', 404);
    }

    if (squad.funcionarios?.length > 0 || squad.clientes?.length > 0) {
      throw new AppError('Não é possível excluir squad que possui funcionários ou clientes', 400);
    }

    await this.squadRepository.delete(id);
  }

  // ═══════════════════════════════════════════════════════════
  // MEMBER MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  async addFuncionario(
    squadId: string,
    dto: AddFuncionarioToSquadRequestDto,
    user: AuthUser
  ): Promise<User> {
    const squad = await this.squadRepository.findById(squadId);

    if (!squad) {
      throw new AppError('Squad não encontrada', 404);
    }

    // Verifica permissão: Admin ou Funcionário da mesma squad
    if (!this.canManageSquadMembers(user, squadId)) {
      throw new AppError('Acesso negado', 403);
    }

    const funcionario = await this.userRepository.findById(dto.usuarioId);

    if (!funcionario) {
      throw new AppError('Funcionário não encontrado', 404);
    }

    if (funcionario.role !== UserRole.FUNCIONARIO) {
      throw new AppError('Usuário não é um funcionário', 400);
    }

    // RD-03 atualizada: Funcionário pode pertencer a múltiplas squads
    // Por ora, apenas atualizamos o squadId principal
    // TODO: Implementar tabela de relacionamento N:N para multi-squad
    funcionario.squadId = squadId;
    await this.userRepository.save(funcionario);

    return funcionario;
  }

  async removeFuncionario(
    squadId: string,
    usuarioId: string,
    user: AuthUser
  ): Promise<void> {
    const squad = await this.squadRepository.findById(squadId);

    if (!squad) {
      throw new AppError('Squad não encontrada', 404);
    }

    // Verifica permissão
    if (!this.canManageSquadMembers(user, squadId)) {
      throw new AppError('Acesso negado', 403);
    }

    // Não pode remover a si mesmo
    if (usuarioId === user.id) {
      throw new AppError('Não pode remover a si mesmo da squad', 400);
    }

    const funcionario = await this.userRepository.findById(usuarioId);

    if (!funcionario || funcionario.squadId !== squadId) {
      throw new AppError('Funcionário não encontrado nesta squad', 404);
    }

    await this.userRepository.updateSquadId(usuarioId, null);
  }

  async addCliente(
    squadId: string,
    dto: AddClienteToSquadRequestDto,
    user: AuthUser
  ): Promise<Cliente> {
    const squad = await this.squadRepository.findById(squadId);

    if (!squad) {
      throw new AppError('Squad não encontrada', 404);
    }

    // Verifica permissão
    if (!this.canManageSquadMembers(user, squadId)) {
      throw new AppError('Acesso negado', 403);
    }

    // Se clienteId fornecido, atribui cliente existente
    if (dto.clienteId) {
      const cliente = await this.clienteRepository.findById(dto.clienteId);

      if (!cliente) {
        throw new AppError('Cliente não encontrado', 404);
      }

      await this.clienteRepository.updateSquadId(dto.clienteId, squadId);
      
      // Return updated cliente
      const updatedCliente = await this.clienteRepository.findById(dto.clienteId);
      return updatedCliente!;
    }

    // Cria novo cliente
    if (!dto.nome || !dto.email || !dto.senha) {
      throw new AppError('Nome, email e senha são obrigatórios para novo cliente', 400);
    }

    // Verifica email duplicado
    const existingCliente = await this.clienteRepository.findByEmail(dto.email);
    if (existingCliente) {
      throw new AppError('Email já cadastrado', 400);
    }

    const hashedPassword = await bcrypt.hash(dto.senha, 10);

    const newCliente = this.clienteRepository.create({
      nome: dto.nome.trim(),
      email: dto.email.toLowerCase(),
      senha: hashedPassword,
      squadId
    });

    return this.clienteRepository.save(newCliente);
  }

  async removeCliente(
    squadId: string,
    clienteId: string,
    user: AuthUser
  ): Promise<void> {
    const squad = await this.squadRepository.findById(squadId);

    if (!squad) {
      throw new AppError('Squad não encontrada', 404);
    }

    // Verifica permissão
    if (!this.canManageSquadMembers(user, squadId)) {
      throw new AppError('Acesso negado', 403);
    }

    const cliente = await this.clienteRepository.findById(clienteId);

    if (!cliente || cliente.squadId !== squadId) {
      throw new AppError('Cliente não encontrado nesta squad', 404);
    }

    await this.clienteRepository.updateSquadId(clienteId, null);
  }

  async getMembers(squadId: string, user: AuthUser): Promise<SquadMembersResult> {
    const squad = await this.squadRepository.findByIdWithMembers(squadId);

    if (!squad) {
      throw new AppError('Squad não encontrada', 404);
    }

    // Verifica permissão
    if (!this.canAccessSquad(user, squadId)) {
      throw new AppError('Acesso negado', 403);
    }

    return {
      squad: {
        id: squad.id,
        nome: squad.nome
      },
      funcionarios: (squad.funcionarios || []).map(f => ({
        id: f.id,
        nome: f.nome,
        email: f.email
      })),
      clientes: (squad.clientes || []).map(c => ({
        id: c.id,
        nome: c.nome,
        email: c.email
      }))
    };
  }

  // ═══════════════════════════════════════════════════════════
  // PERMISSION HELPERS
  // ═══════════════════════════════════════════════════════════

  private canAccessSquad(user: AuthUser, squadId: string): boolean {
    if (user.role === UserRole.ADMIN_MASTER) return true;
    return user.squadId === squadId;
  }

  private canManageSquadMembers(user: AuthUser, squadId: string): boolean {
    if (user.role === UserRole.ADMIN_MASTER) return true;
    if (user.role === UserRole.FUNCIONARIO && user.squadId === squadId) return true;
    return false;
  }
}
