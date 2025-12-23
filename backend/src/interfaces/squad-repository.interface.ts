import { Squad } from '../entities/Squad';
import { User } from '../entities/User';
import { Cliente } from '../entities/Cliente';
import { Empresa } from '../entities/Empresa';

export interface ISquadRepository {
  findAll(): Promise<Squad[]>;
  findById(id: string): Promise<Squad | null>;
  findByIdWithMembers(id: string): Promise<Squad | null>;
  findByEmpresaId(empresaId: string): Promise<Squad[]>;
  save(squad: Partial<Squad>): Promise<Squad>;
  delete(id: string): Promise<void>;
}

export interface IEmpresaRepository {
  findById(id: string): Promise<Empresa | null>;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findBySquadId(squadId: string): Promise<User[]>;
  save(user: Partial<User>): Promise<User>;
  updateSquadId(userId: string, squadId: string | null): Promise<void>;
}

export interface IClienteRepository {
  findById(id: string): Promise<Cliente | null>;
  findByEmail(email: string): Promise<Cliente | null>;
  findBySquadId(squadId: string): Promise<Cliente[]>;
  save(cliente: Partial<Cliente>): Promise<Cliente>;
  create(cliente: Partial<Cliente>): Cliente;
  updateSquadId(clienteId: string, squadId: string | null): Promise<void>;
}
