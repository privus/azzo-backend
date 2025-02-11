import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ObjectIdColumn, ObjectId } from 'typeorm';
import { ParcelaCredito } from './';

@Entity('status_pagamento')
export class StatusPagamento {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => ParcelaCredito, (Parcela) => Parcela.status_pagamento)
  Parcelas: ParcelaCredito[];
}
