import { DataSource } from 'typeorm';
import { Cargo, Permissao, CargoPermissao } from '../entities';
import { Seeder } from 'typeorm-extension';

export class CargoPermissaoSeed implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const cargoRepository = dataSource.getRepository(Cargo);
    const permissaoRepository = dataSource.getRepository(Permissao);
    const cargoPermissaoRepository = dataSource.getRepository(CargoPermissao);

    const associations = [
      {
        cargo: 'Administrador',
        permissoes: [
          { nome: 'Gerenciamento de Usuários', ler: 1, editar: 1, criar: 1 },
          { nome: 'Gerenciamento Financeiro', ler: 1, editar: 1, criar: 1 },
          { nome: 'Gerenciamento de Estoque', ler: 1, editar: 1, criar: 1 },
          { nome: 'Relatórios', ler: 1, editar: 1, criar: 1 },
        ],
      },
      {
        cargo: 'Gerente',
        permissoes: [
          { nome: 'Gerenciamento de Usuários', ler: 1, editar: 1, criar: 1 },
          { nome: 'Gerenciamento Financeiro', ler: 1, editar: 1, criar: 0 },
          { nome: 'Gerenciamento de Estoque', ler: 1, editar: 1, criar: 1 },
        ],
      },
    ];

    for (const association of associations) {
      try {
        const cargo = await cargoRepository.findOne({ where: { nome: association.cargo } });

        if (!cargo) {
          console.error(`Cargo ${association.cargo} não encontrado.`);
          continue;
        }

        for (const perm of association.permissoes) {
          const permissao = await permissaoRepository.findOne({ where: { nome: perm.nome } });

          if (!permissao) {
            console.error(`Permissão ${perm.nome} não encontrada.`);
            continue;
          }

          const cargoPermissao = cargoPermissaoRepository.create({
            cargo,
            permissao,
            ler: perm.ler,
            editar: perm.editar,
            criar: perm.criar,
          });

          await cargoPermissaoRepository.save(cargoPermissao);

          console.log(`Permissão ${perm.nome} associada ao cargo ${association.cargo}.`);
        }
      } catch (error) {
        console.error(`Erro ao associar permissões ao cargo ${association.cargo}:`, error);
      }
    }
  }
}
