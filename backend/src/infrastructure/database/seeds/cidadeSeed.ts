import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import * as fs from 'fs';
import * as path from 'path';
import { Cidade, Estado } from '../entities';

export class CidadeSeed implements Seeder { async run(dataSource: DataSource): Promise<void> {
    const cidadeRepository = dataSource.getRepository(Cidade);
    const estadoRepository = dataSource.getRepository(Estado);

    const jsonFilePath = path.resolve('/home/ubuntu/azzo-backend/backend/src/utils/cidades.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

    for (const cidadeData of jsonData) {
      // Carregar a entidade Estado
      const estado = await estadoRepository.findOne({
        where: { estado_id: cidadeData.estado_id },
      });

      if (!estado) {
        console.error(`Estado com ID ${cidadeData.estado_id} não encontrado. Cidade ${cidadeData.nome} não será adicionada.`);
        continue;
      }

      // Verificar se a cidade já existe com o mesmo nome e estado
      const cidadeExistente = await cidadeRepository.findOne({
        where: {
          nome: cidadeData.nome,
          estado: { estado_id: estado.estado_id },
        },
        relations: ['estado'],
      });

      if (cidadeExistente) {
        console.log(`Cidade ${cidadeData.nome} no estado ${estado.nome} já existe. Nenhuma alteração foi feita.`);
        continue;
      }

      // Criar nova cidade
      const newCidade = cidadeRepository.create({
        nome: cidadeData.nome,
        estado: estado, // Atribui a relação com Estado
      });

      await cidadeRepository.save(newCidade);
      console.log(`Cidade ${cidadeData.nome} no estado ${estado.nome} foi adicionada.`);
    }
  }
}
