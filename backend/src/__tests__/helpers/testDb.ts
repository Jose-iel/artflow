import { AppDataSource } from '../../config/data-source';
import { Post } from '../../entities/Post';
import { Cliente } from '../../entities/Cliente';
import { User } from '../../entities/User';
import { Squad } from '../../entities/Squad';
import { Empresa } from '../../entities/Empresa';

export const initializeTestDb = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    return;
  }

  await AppDataSource.initialize();
};

export const closeTestDb = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
};

export const clearTestDb = async (): Promise<void> => {
  if (!AppDataSource.isInitialized) {
    return;
  }

  // Delete in reverse dependency order to avoid foreign key constraints
  const entities = [Post, User, Cliente, Squad, Empresa];
  
  for (const entity of entities) {
    await AppDataSource.createQueryBuilder()
      .delete()
      .from(entity)
      .execute();
  }
};

export const getTestDb = () => {
  if (!AppDataSource.isInitialized) {
    throw new Error('Test database not initialized. Call initializeTestDb() first.');
  }
  return AppDataSource;
};
