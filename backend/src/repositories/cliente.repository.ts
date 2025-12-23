import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Cliente } from '../entities/Cliente';
import { IClienteRepository } from '../interfaces/squad-repository.interface';

export class ClienteRepository implements IClienteRepository {
  private repository: Repository<Cliente>;

  constructor() {
    this.repository = AppDataSource.getRepository(Cliente);
  }

  async findById(id: string): Promise<Cliente | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['squad']
    });
  }

  async findByEmail(email: string): Promise<Cliente | null> {
    return this.repository.findOne({
      where: { email: email.toLowerCase() }
    });
  }

  async findBySquadId(squadId: string): Promise<Cliente[]> {
    return this.repository.find({
      where: { squadId },
      order: { nome: 'ASC' }
    });
  }

  async save(cliente: Partial<Cliente>): Promise<Cliente> {
    return this.repository.save(cliente);
  }

  create(cliente: Partial<Cliente>): Cliente {
    return this.repository.create(cliente);
  }

  async updateSquadId(clienteId: string, squadId: string | null): Promise<void> {
    await this.repository.update(clienteId, { squadId });
  }
}
