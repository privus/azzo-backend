import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { StatusPagamento, Debito } from './';

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

  @Column({ type: 'date' })
  data_criacao: Date;

  @Column({ type: 'date' })
  data_vencimento: Date;

  @Column({ type: 'date', nullable: true })
  data_pagamento: Date;

  @ManyToOne(() => StatusPagamento)
  @JoinColumn({ name: 'status_pagamento_id' })
  status_pagamento: StatusPagamento;

  @ManyToOne(() => Debito, (debito) => debito.parcela_debito)
  @JoinColumn({ name: 'debito_id' })
  debito: Debito;
}
