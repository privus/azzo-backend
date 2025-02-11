import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { StatusVenda } from '../entities';

export class StatusVendaSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const statusVendaRepository = dataSource.getRepository(StatusVenda);
    await statusVendaRepository.save([
      { id: 11138, nome: 'Aguardando Aprovação' },
      { id: 11139, nome: 'Pedido' },
      { id: 11468, nome: 'Reprovado' },
      { id: 11491, nome: 'Faturado' },
      { id: 11541, nome: 'Pronto para Envio' },
      { id: 11542, nome: 'Enviado' },
      { id: 11543, nome: 'Entregue' },
    ]);
  }
}
