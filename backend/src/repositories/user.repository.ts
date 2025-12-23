import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { IUserRepository } from '../interfaces/squad-repository.interface';

export class UserRepository implements IUserRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['squad', 'squad.empresa']
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email: email.toLowerCase() }
    });
  }

  async findBySquadId(squadId: string): Promise<User[]> {
    return this.repository.find({
      where: { squadId },
      order: { nome: 'ASC' }
    });
  }

  async save(user: Partial<User>): Promise<User> {
    return this.repository.save(user);
  }

  async updateSquadId(userId: string, squadId: string | null): Promise<void> {
    await this.repository.update(userId, { squadId });
  }
}
