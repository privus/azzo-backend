import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Cliente } from './cliente';
import { CanalVenda } from './canalVenda';
import { Usuario } from './usuario';
import { Produto } from './produto';
import { FormaPagamento } from './formaPagamento';
import { StatusPagamento } from './statusPagamento';
import { StatusEnvio } from './statusEnvio';
import { TipoEnvio } from './tipoEnvio';

@Entity('venda')
export class Venda {
  @PrimaryGeneratedColumn('increment')
  venda_id: number;

  @Column({ type: 'int' })
  cliente_id: number;

  @Column({ type: 'int' })
  canal_venda_id: number;

  @Column({ type: 'int' })
  vendedor_id: number;

  @Column({ type: 'date' })
  data_pedido: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  observacao: string;

  @Column({ type: 'int' })
  produto_id: number;

  @Column({ type: 'int' })
  numero_parcelas: number;

  @Column({ type: 'int' })
  forma_pagamento_id: number;

  @Column({ type: 'date' })
  data_vencimento: Date;

  @Column({ type: 'varchar', length: 90, nullable: true })
  descricao: string;

  @Column({ type: 'int' })
  status_pagamento_id: number;

  @Column({ type: 'int' })
  status_envio_id: number;

  @Column({ type: 'decimal' })
  valor_total: number;

  @Column({ type: 'int', nullable: true })
  tipo_envio_id: number;

  @Column({ type: 'decimal', nullable: true })
  custo_envio: number;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @ManyToOne(() => CanalVenda)
  @JoinColumn({ name: 'canal_venda_id' })
  canalVenda: CanalVenda;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: Usuario;

  @ManyToOne(() => Produto)
  @JoinColumn({ name: 'produto_id' })
  produto: Produto;

  @ManyToOne(() => FormaPagamento)
  @JoinColumn({ name: 'forma_pagamento_id' })
  formaPagamento: FormaPagamento;

  @ManyToOne(() => StatusPagamento)
  @JoinColumn({ name: 'status_pagamento_id' })
  statusPagamento: StatusPagamento;

  @ManyToOne(() => StatusEnvio)
  @JoinColumn({ name: 'status_envio_id' })
  statusEnvio: StatusEnvio;

  @ManyToOne(() => TipoEnvio)
  @JoinColumn({ name: 'tipo_envio_id' })
  tipoEnvio: TipoEnvio;
}
