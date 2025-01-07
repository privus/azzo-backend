import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ParcelaDebito } from './';

@Entity('debito')
export class Debito {
  @PrimaryGeneratedColumn('increment')
  debito_id: number;

  @Column({ type: 'int', nullable: true })
  numero_parcelas: number;

  @Column({ type: 'date' })
  data_criacao: Date;

  @Column({ type: 'varchar', length: 240, nullable: true })
  observacao: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_parcela: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_total: number;

  @Column({ type: 'varchar', length: 180 })
  metodo_pagamento: string;

  @Column({ type: 'varchar', length: 180 })
  datas_vencimento: Date;

  @OneToMany(() => ParcelaDebito, (parcela) => parcela.debito, { cascade: true })
  parcela: ParcelaDebito[];
}
