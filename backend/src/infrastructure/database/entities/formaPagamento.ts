import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Venda, Transacao } from './';

@Entity('forma_pagamento')
export class FormaPagamento {
  @PrimaryGeneratedColumn('increment')
  forma_pagamento_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => Venda, (venda) => venda.formaPagamento)
  vendas: Venda[];

  @OneToMany(() => Transacao, (transacao) => transacao.formaPagamento)
  transacoes: Transacao[];
}
