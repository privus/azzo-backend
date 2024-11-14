import { DataSource } from 'typeorm';
import { Cargo } from '../entities';
import { Seeder } from 'typeorm-extension';

export class CargoSeed implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const cargoRepository = dataSource.getRepository(Cargo);

    const cargos = [
      { nome: 'Desenvolvedor', somaPermissao: 15 },
      { nome: 'Vendedor', somaPermissao: 3 },
      { nome: 'Designer', somaPermissao: 1 },
      { nome: 'Gerente', somaPermissao: 6 },
      { nome: 'Analista', somaPermissao: 3 },
      { nome: 'Estagiário', somaPermissao: 0 },
      { nome: 'Auxiliar', somaPermissao: 1 },
    ];

    for (const cargo of cargos) {
      try {
        const cargoExists = await cargoRepository.findOneBy({ nome: cargo.nome });

        if (cargoExists) {
          console.log(`Cargo ${cargo.nome} já existe. Nenhuma alteração foi feita.`);
        } else {
          const newCargo = cargoRepository.create(cargo);
          await cargoRepository.save(newCargo);
          console.log(`Cargo ${cargo.nome} foi adicionado.`);
        }
      } catch (error) {
        console.error(`Erro ao processar o cargo ${cargo.nome}:`, error);
      }
    }
  }
}
