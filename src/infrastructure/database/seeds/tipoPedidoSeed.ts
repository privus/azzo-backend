import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { TipoPedido } from '../entities';

export class TipoPedidoSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const tipoPedidoRepository = dataSource.getRepository(TipoPedido);
    await tipoPedidoRepository.save([
      { id: 10441, nome: 'Bonificação' },
      { id: 10440, nome: 'Brinde' },
      { id: 10442, nome: 'Doação' },
      { id: 10439, nome: 'Troca' },
      { id: 10438, nome: 'Venda' },
    ]);
  }
}
