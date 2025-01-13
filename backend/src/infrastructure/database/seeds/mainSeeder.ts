import { DataSource } from 'typeorm';
import { runSeeder, Seeder } from 'typeorm-extension';
import {
  UsuarioSeed,
  EstadoSeed,
  CargoSeed,
  CidadeSeed,
  RegiaoSeed,
  CargoPermissaoSeed,
  StatusPagamentoSeed,
  StatusClienteSeed,
  PermissaoSeed,
  StatusVendaSeed,
} from './';

export class MainSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    await runSeeder(dataSource, EstadoSeed);
    await runSeeder(dataSource, CidadeSeed);
    await runSeeder(dataSource, CargoSeed);
    await runSeeder(dataSource, RegiaoSeed);
    await runSeeder(dataSource, UsuarioSeed);
    await runSeeder(dataSource, PermissaoSeed);
    await runSeeder(dataSource, CargoPermissaoSeed);
    await runSeeder(dataSource, StatusPagamentoSeed);
    await runSeeder(dataSource, StatusClienteSeed);
    await runSeeder(dataSource, StatusVendaSeed);
  }
}
