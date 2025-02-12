import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { StatusVenda } from '../entities';

export class StatusVendaSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const statusVendaRepository = dataSource.getRepository(StatusVenda);
    await statusVendaRepository.save([
      { status_venda_id: 11138, nome: 'Aguardando Aprovação' },
      { status_venda_id: 11139, nome: 'Pedido' },
      { status_venda_id: 11468, nome: 'Reprovado' },
      { status_venda_id: 11491, nome: 'Faturado' },
      { status_venda_id: 11541, nome: 'Pronto para Envio' },
      { status_venda_id: 11542, nome: 'Enviado' },
      { status_venda_id: 11543, nome: 'Entregue' },
    ]);
  }
}
