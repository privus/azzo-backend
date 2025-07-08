import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { StatusPagamento, Debito, Account } from './';

@Entity('parcela_debito')
export class ParcelaDebito {
  @PrimaryGeneratedColumn('increment')
  parcela_id: number;

  @Column({ type: 'int' })
  numero: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  juros: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data_criacao: Date;

  @Column({ type: 'date' })
  data_vencimento: Date;

  @Column({ type: 'date', default: null })
  data_competencia: Date;

  @Column({ type: 'date', nullable: true })
  data_pagamento: Date;

  @Column({ type: 'varchar', length: 90, nullable: true })
  conta: string;

  @Column({ type: 'varchar', length: 90, nullable: true })
  atualizado_por: string;

  @ManyToOne(() => StatusPagamento)
  @JoinColumn({ name: 'status_pagamento_id' })
  status_pagamento: StatusPagamento;

  @ManyToOne(() => Debito, (debito) => debito.parcela_debito, {onDelete: 'CASCADE'})
  debito: Debito;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;
}
