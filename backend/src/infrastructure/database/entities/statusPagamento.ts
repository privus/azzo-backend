import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Venda } from './venda';
import { Financeiro } from './financeiro';

@Entity('status_pagamento')
export class StatusPagamento {
  @PrimaryGeneratedColumn('increment')
  status_pagamento_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => Venda, (venda) => venda.statusPagamento)
  vendas: Venda[];

  @OneToMany(() => Financeiro, (financeiro) => financeiro.statusPagamento)
  financeiros: Financeiro[];
}
