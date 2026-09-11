import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import 'reflect-metadata';
import * as dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '../.env', override: true });

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'sga_admin',
  password: process.env.DB_PASSWORD || 'sga_secret_2026',
  database: process.env.DB_NAME || 'sga_itbt',
  entities: [__dirname + '/../modules/**/entities/*.entity.{ts,js}'],
  migrations: [__dirname + '/../database/migrations/*.{ts,js}'],
  autoLoadEntities: true,
  synchronize: process.env.NODE_ENV === 'production' ? false : true,
  logging: process.env.NODE_ENV === 'production' ? false : ['warn', 'error'],
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

export default typeOrmConfig;