import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { StatusPagamento } from '../entities';

export default class StatusPagamentoSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const statusPagamentoRepository = dataSource.getRepository(StatusPagamento);
    await statusPagamentoRepository.save([
      { id: 1, nome: 'Pendente' },
      { id: 2, nome: 'Pago' },
      { id: 3, nome: 'Em Atraso' },
      { id: 4, nome: 'Cancelado' },
    ]);
  }
}
