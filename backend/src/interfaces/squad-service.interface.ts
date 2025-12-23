import { Squad } from '../entities/Squad';
import { User, UserRole } from '../entities/User';
import { Cliente } from '../entities/Cliente';
import { AddFuncionarioToSquadRequestDto } from '../dtos/request/add-funcionario-to-squad.request.dto';
import { AddClienteToSquadRequestDto } from '../dtos/request/add-cliente-to-squad.request.dto';

export interface AuthUser {
  id: string;
  role: UserRole;
  squadId?: string;
}

export interface SquadMembersResult {
  squad: { id: string; nome: string };
  funcionarios: Array<{ id: string; nome: string; email: string }>;
  clientes: Array<{ id: string; nome: string; email: string }>;
}

export interface ISquadService {
  findAll(user: AuthUser): Promise<Squad[]>;
  findById(id: string, user: AuthUser): Promise<Squad>;
  create(nome: string, descricao: string | undefined, empresaId: string): Promise<Squad>;
  update(id: string, data: Partial<Squad>): Promise<Squad>;
  delete(id: string): Promise<void>;
  
  // Member management
  addFuncionario(squadId: string, dto: AddFuncionarioToSquadRequestDto, user: AuthUser): Promise<User>;
  removeFuncionario(squadId: string, usuarioId: string, user: AuthUser): Promise<void>;
  addCliente(squadId: string, dto: AddClienteToSquadRequestDto, user: AuthUser): Promise<Cliente>;
  removeCliente(squadId: string, clienteId: string, user: AuthUser): Promise<void>;
  getMembers(squadId: string, user: AuthUser): Promise<SquadMembersResult>;
}
