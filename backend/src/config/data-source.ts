import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';
import { Cliente } from '../entities/Cliente';
import { Post } from '../entities/Post';
import { Empresa } from '../entities/Empresa';
import { Squad } from '../entities/Squad';
import { User } from '../entities/User';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const databaseConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'artflow',
  synchronize: isTest, // Habilitado em testes para criar schema automaticamente
  dropSchema: isTest, // Limpa banco antes de cada execução de testes
  logging: !isProduction && !isTest,
  entities: [Cliente, Post, Empresa, Squad, User],
  migrations: [],
  subscribers: [],
};

export const AppDataSource = new DataSource(databaseConfig);

export default AppDataSource;
