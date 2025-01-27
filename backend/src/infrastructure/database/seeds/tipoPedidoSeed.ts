import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { TipoPedido } from '../entities';

export class TipoPedidoSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const tipoPedidoRepository = dataSource.getRepository(TipoPedido);
    await tipoPedidoRepository.save([
      { tipo_pedido_id: 10441, nome: 'Bonificação' },
      { tipo_pedido_id: 10440, nome: 'Brinde' },
      { tipo_pedido_id: 10442, nome: 'Doação' },
      { tipo_pedido_id: 10439, nome: 'Troca' },
      { tipo_pedido_id: 10438, nome: 'Venda S/ Nota' },
      { tipo_pedido_id: 10794, nome: 'Venda C/ Nota' },
    ]);
  }
}
