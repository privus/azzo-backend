import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'database-azzo.cj46y6k2uqf8.sa-east-1.rds.amazonaws.com',
  port: 3306,
  username: 'user',
  password: 'senha123',
  database: 'bancoAzzo',
  entities: [`${__dirname}**/entities/*.{ts,js}`],
  migrations: ['dist/infrastructure/database/migrations/*.js'],
  synchronize: false, // Defina como false em produção e use migrações
  logging: process.env.DB_LOGGING === 'true', // Controle de logging via variável de ambiente
});
