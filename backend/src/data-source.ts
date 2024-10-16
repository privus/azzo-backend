import { DataSource, DataSourceOptions } from 'typeorm';
import { runSeeders, SeederOptions } from 'typeorm-extension';
import { MainSeeder } from './seeds/main.seeder';

const options: DataSourceOptions & SeederOptions = {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'usuario',
  password: 'senha',
  database: 'meu_banco',
  synchronize: false,
  logging: false,
  entities: [`${__dirname}**/entities/*.{ts,js}`],
  migrations: [`${__dirname}**/migrations/*.{ts,js}`],
  seeds: [MainSeeder],
};

export const AppDataSource = new DataSource(options);

AppDataSource.initialize()
  .then(async () => {
    console.log('Data Source has been initialized!');
    await runSeeders(AppDataSource);
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });
