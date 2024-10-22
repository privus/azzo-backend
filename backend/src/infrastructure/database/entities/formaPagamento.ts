import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Venda } from './venda';
import { Financeiro } from './financeiro';

@Entity('forma_pagamento')
export class FormaPagamento {
  @PrimaryGeneratedColumn('increment')
  forma_pagamento_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => Venda, (venda) => venda.formaPagamento)
  vendas: Venda[];

  @OneToMany(() => Financeiro, (financeiro) => financeiro.formaPagamento)
  financeiros: Financeiro[];
}
