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

  const queryRunner = AppDataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    await queryRunner.query('TRUNCATE TABLE posts RESTART IDENTITY CASCADE');
    await queryRunner.query('TRUNCATE TABLE clientes RESTART IDENTITY CASCADE');
    await queryRunner.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
    await queryRunner.query('TRUNCATE TABLE squads RESTART IDENTITY CASCADE');
    await queryRunner.query('TRUNCATE TABLE empresas RESTART IDENTITY CASCADE');

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
};

export const getTestDb = () => {
  if (!AppDataSource.isInitialized) {
    throw new Error('Test database not initialized. Call initializeTestDb() first.');
  }
  return AppDataSource;
};
