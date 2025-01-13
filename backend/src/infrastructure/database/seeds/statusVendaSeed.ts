import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { StatusVenda } from '../entities';

export class StatusVendaSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const statusVendaRepository = dataSource.getRepository(StatusVenda);
    await statusVendaRepository.save([
      { id: 1, nome: 'Aguardando Aprovação' },
      { id: 2, nome: 'Pedido ' },
      { id: 3, nome: 'Empacotado' },
      { id: 4, nome: 'Pronto para Envio' },
      { id: 5, nome: 'Enviado' },
      { id: 6, nome: 'Entregue' },
      { id: 7, nome: 'Cancelado' },
    ]);
  }
}
