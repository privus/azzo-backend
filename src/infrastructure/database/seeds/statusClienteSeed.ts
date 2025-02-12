import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { StatusCliente } from '../entities';

export class StatusClienteSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const statusClienteRepository = dataSource.getRepository(StatusCliente);
    await statusClienteRepository.save([
      { status_cliente_id: 101, nome: 'ATIVO' },
      { status_cliente_id: 102, nome: 'FRIO' },
      { status_cliente_id: 103, nome: 'INATIVO' },
    ]);
  }
}
