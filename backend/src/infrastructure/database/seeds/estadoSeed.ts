import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import * as fs from 'fs';
import * as path from 'path';
import { Estado } from '../entities';

export class EstadoSeed implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const estadoRepository = dataSource.getRepository(Estado);

    // Defina o caminho para o arquivo JSON gerado
    const jsonFilePath = path.resolve('/home/ubuntu/azzo-backend/backend/src/utils/estados.json');    
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

    // Itera sobre os dados e insere no banco de dados
    for (const estado of jsonData) {
      const estadoExists = await estadoRepository.findOneBy({
        nome: estado.nome,
      });

      if (estadoExists) {
        console.log(`Estado ${estado.nome} já existe. Nenhuma alteração foi feita.`);
        continue;
      }

      const newEstado = estadoRepository.create(estado);
      await estadoRepository.save(newEstado);
      console.log(`Estado ${estado.nome} foi adicionado.`);
    }
  }
}
