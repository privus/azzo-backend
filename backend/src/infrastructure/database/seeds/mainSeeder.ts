import { DataSource } from 'typeorm';
import { runSeeder, Seeder } from 'typeorm-extension';
import { UsuarioSeed } from './usuarioSeed';
import { EstadoSeed } from './estadoSeed';
import { CargoSeed } from './cargoSeed';
import { CidadeSeed } from './cidadeSeed';

export class MainSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    await runSeeder(dataSource, EstadoSeed);
    await runSeeder(dataSource, CidadeSeed);
    await runSeeder(dataSource, CargoSeed);
    await runSeeder(dataSource, UsuarioSeed);
  }
}
