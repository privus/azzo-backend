import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { StatusPagamento } from './statusPagamento';
import { CategoriaTransacao } from './categoriaTransacao';
import { Venda } from './venda';
import { FormaPagamento } from './formaPagamento';

@Entity('financeiro')
export class Financeiro {
  @PrimaryGeneratedColumn('increment')
  transacao_id: number;

  @Column({ type: 'tinyint' })
  tipo: boolean;

  @Column({ type: 'datetime' })
  data_criacao: Date;

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

  @Column({ type: 'datetime', nullable: true })
  data_vencimento: Date;

  @Column({ type: 'date', nullable: true })
  data_efetiva: Date;

  @Column({ type: 'int', nullable: true })
  parcelas: number;

  @Column({ type: 'int', nullable: true })
  venda_id: number;

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
}
