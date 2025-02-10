import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ParcelaCredito } from './';

@Entity('status_pagamento')
export class StatusPagamento {
  @PrimaryGeneratedColumn('increment')
  status_pagamento_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => ParcelaCredito, (Parcela) => Parcela.status_pagamento)
  Parcelas: ParcelaCredito[];
}
