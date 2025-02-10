import { DataSource } from 'typeorm';
import { Permissao } from '../entities';
import { Seeder } from 'typeorm-extension';

export class PermissaoSeed implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const permissaoRepository = dataSource.getRepository(Permissao);

    const permissoes = [
      { nome: 'Gerenciamento de Usuários' },
      { nome: 'Gerenciamento de Estoque' },
      { nome: 'Gerenciamento Financeiro' },
      { nome: 'Relatórios' },
    ];

    for (const permissao of permissoes) {
      try {
        const permissaoExists = await permissaoRepository.findOneBy({ nome: permissao.nome });

        if (permissaoExists) {
          console.log(`Permissão ${permissao.nome} já existe. Nenhuma alteração foi feita.`);
        } else {
          const newPermissao = permissaoRepository.create(permissao);
          await permissaoRepository.save(newPermissao);
          console.log(`Permissão ${permissao.nome} foi adicionada.`);
        }
      } catch (error) {
        console.error(`Erro ao processar a permissão ${permissao.nome}:`, error);
      }
    }
  }
}
