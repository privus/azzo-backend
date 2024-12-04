import { DataSource } from 'typeorm';
import { runSeeder, Seeder } from 'typeorm-extension';
import { UsuarioSeed } from './usuarioSeed';
import { EstadoSeed } from './estadoSeed';
import { CargoSeed } from './cargoSeed';
import { CidadeSeed } from './cidadeSeed';
import { RegiaoSeed } from './regiaoSeed';
import { PermissaoSeed } from './permissaoSeed';
import { CargoPermissaoSeed } from './cargoPermissaoSeed';

export class MainSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    await runSeeder(dataSource, EstadoSeed);
    await runSeeder(dataSource, CidadeSeed);
    await runSeeder(dataSource, CargoSeed);
    await runSeeder(dataSource, RegiaoSeed);
    await runSeeder(dataSource, UsuarioSeed);
    await runSeeder(dataSource, PermissaoSeed);
    await runSeeder(dataSource, CargoPermissaoSeed);
  }
}
