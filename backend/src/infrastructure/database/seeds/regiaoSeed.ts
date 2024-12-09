import { DataSource } from 'typeorm';
import { Regiao } from '../entities';
import { Seeder } from 'typeorm-extension';

export class RegiaoSeed implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const regiaoRepository = dataSource.getRepository(Regiao);

    const regioes = [{ nome: 'Norte' }, { nome: 'Nordeste' }, { nome: 'Centro-Oeste' }, { nome: 'Sudeste' }, { nome: 'Sul' }];

    for (const regiao of regioes) {
      try {
        const regiaoExists = await regiaoRepository.findOneBy({ nome: regiao.nome });

        if (regiaoExists) {
          console.log(`Região ${regiao.nome} já existe. Nenhuma alteração foi feita.`);
        } else {
          const newRegiao = regiaoRepository.create(regiao);
          await regiaoRepository.save(newRegiao);
          console.log(`Região ${regiao.nome} foi adicionada.`);
        }
      } catch (error) {
        console.error(`Erro ao processar a região ${regiao.nome}:`, error);
      }
    }
  }
}
