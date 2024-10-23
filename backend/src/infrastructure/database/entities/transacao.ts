import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { StatusPagamento, CategoriaTransacao, Venda, FormaPagamento, Debito } from './';


@Entity('transacao')
export class Transacao {
  @PrimaryGeneratedColumn('increment')
  transacao_id: number;

  @Column({ type: 'tinyint' })
  tipo: boolean;

  @Column({ type: 'varchar', length: 45 })
  data_criacao: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  descricao: string;

  @Column({ type: 'decimal' })
  valor: number;

  @Column({ type: 'int' })
  categoria_id: number;

  @Column({ type: 'int' })
  status_pagamento_id: number;

  @Column({ type: 'varchar', length: 45, nullable: true })
  observacao: string;

  @Column({ type: 'varchar', length: 45 })
  data_vencimento: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  data_efetiva?: string;

  @Column({ type: 'int', nullable: true })
  total_parcelas?: number;

  @Column({ type: 'int', nullable: true })
  forma_pagamento_id: number;

  @ManyToOne(() => StatusPagamento)
  @JoinColumn({ name: 'status_pagamento_id' })
  statusPagamento: StatusPagamento;

  @ManyToOne(() => CategoriaTransacao)
  @JoinColumn({ name: 'categoria_id' })
  categoriaTransacao: CategoriaTransacao;

  @ManyToOne(() => Venda)
  @JoinColumn({ name: 'venda_id' })
  venda: Venda;

  @ManyToOne(() => FormaPagamento)
  @JoinColumn({ name: 'forma_pagamento_id' })
  formaPagamento: FormaPagamento;

  @ManyToOne(() => Debito, { nullable: true })
  @JoinColumn({ name: 'debito_id' })
  debito?: Debito;
}
