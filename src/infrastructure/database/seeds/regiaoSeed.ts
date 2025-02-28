import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Regiao } from '../entities';

export class RegiaoSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const regiaoRepository = dataSource.getRepository(Regiao);

    // Lista de regiões a serem criadas
    const regioes = [
      { nome: 'Região Piumhi', id_regiao: 1 },
      { nome: 'Região Extrema', id_regiao: 2 },
      { nome: 'Região Zona da Mata', id_regiao: 3 },
      { nome: 'Região Passos', id_regiao: 4 },
      { nome: 'Região Pouso Alegre', id_regiao: 5 },
      { nome: 'Região Poços de Caldas', id_regiao: 6 },
      { nome: 'Região Alfenas', id_regiao: 7 },
      { nome: 'Região São Lourenço', id_regiao: 8 },
    ];

    for (const item of regioes) {
      try {
        // Verifica se a região já existe pelo nome
        let regiaoEntity = await regiaoRepository.findOneBy({ nome: item.nome });

        if (!regiaoEntity) {
          // Caso não exista, cria a nova região com o código fornecido
          regiaoEntity = regiaoRepository.create({
            nome: item.nome,
            codigo: item.id_regiao,
          });

          await regiaoRepository.save(regiaoEntity);
          console.log(`Região '${item.nome}' foi criada com ID ${item.id_regiao}.`);
        } else {
          console.log(`Região '${item.nome}' já existe no banco. Nenhuma alteração foi feita.`);
        }
      } catch (error) {
        console.error(`Erro ao criar a região '${item.nome}':`, error);
      }
    }
  }
}
