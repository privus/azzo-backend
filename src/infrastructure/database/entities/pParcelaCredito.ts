import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Account, CategoriaCredito, StatusPagamento, PVenda } from './';

@Entity('p_parcela_credito')
export class PParcelaCredito {
  @PrimaryGeneratedColumn('increment')
  parcela_id: number;

  @Column({ type: 'varchar', length: 90, nullable: true })
  nome: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  descricao: string;

  @Column({ type: 'varchar', length: 90, nullable: true })
  conta: string;

  @Column({ type: 'int', nullable: true })
  numero: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  juros: number;

  @Column({ type: 'date' })
  data_criacao: Date;

  @Column({ type: 'date' })
  data_vencimento: Date;

  @Column({ type: 'date', nullable: true })
  data_pagamento: Date;

  @Column({ type: 'date', nullable: true, default: null })
  data_competencia: Date;

  @Column({ type: 'varchar', length: 180, nullable: true })
  atualizado_por: string;

  @ManyToOne(() => StatusPagamento)
  @JoinColumn({ name: 'status_pagamento_id' })
  status_pagamento: StatusPagamento;

  @ManyToOne(() => PVenda, (venda) => venda.parcela_credito, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venda_id' })
  venda: PVenda;

  @ManyToOne(() => CategoriaCredito, (categoria) => categoria.parcelacredito)
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaCredito;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;
}
