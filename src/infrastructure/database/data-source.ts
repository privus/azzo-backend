import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '152.53.39.254',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  username: process.env.DB_USERNAME || 'azzo-user',
  password: process.env.DB_PASSWORD || 'privus123',
  database: process.env.DB_NAME || 'azzo-database',
  entities: [`${__dirname}**/entities/*.{ts,js}`],
  migrations: ['dist/infrastructure/database/migrations/*.js'],
  synchronize: false, // Defina como false em produção e use migrações
  logging: process.env.DB_LOGGING === 'true', // Controle de logging via variável de ambiente
});
