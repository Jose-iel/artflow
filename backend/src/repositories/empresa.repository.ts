import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Empresa } from '../entities/Empresa';
import { IEmpresaRepository } from '../interfaces/squad-repository.interface';

export class EmpresaRepository implements IEmpresaRepository {
  private repository: Repository<Empresa>;

  constructor() {
    this.repository = AppDataSource.getRepository(Empresa);
  }

  async findById(id: string): Promise<Empresa | null> {
    return this.repository.findOne({
      where: { id }
    });
  }
}
