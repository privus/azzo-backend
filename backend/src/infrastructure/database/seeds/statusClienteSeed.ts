import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { StatusCliente } from '../entities';

export class StatusClienteSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const statusClienteRepository = dataSource.getRepository(StatusCliente);
    await statusClienteRepository.save([
      { id: 1, nome: 'ATIVO' },
      { id: 2, nome: 'FRIO' },
      { id: 3, nome: 'INATIVO' },
    ]);
  }
}
