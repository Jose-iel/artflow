import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Squad } from '../entities/Squad';
import { ISquadRepository } from '../interfaces/squad-repository.interface';

export class SquadRepository implements ISquadRepository {
  private repository: Repository<Squad>;

  constructor() {
    this.repository = AppDataSource.getRepository(Squad);
  }

  async findAll(): Promise<Squad[]> {
    return this.repository.find({
      relations: ['empresa', 'funcionarios', 'clientes'],
      order: { criadoEm: 'DESC' }
    });
  }

  async findById(id: string): Promise<Squad | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['empresa']
    });
  }

  async findByIdWithMembers(id: string): Promise<Squad | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['empresa', 'funcionarios', 'clientes']
    });
  }

  async findByEmpresaId(empresaId: string): Promise<Squad[]> {
    return this.repository.find({
      where: { empresaId },
      relations: ['empresa', 'funcionarios', 'clientes'],
      order: { criadoEm: 'DESC' }
    });
  }

  async save(squad: Partial<Squad>): Promise<Squad> {
    return this.repository.save(squad);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
