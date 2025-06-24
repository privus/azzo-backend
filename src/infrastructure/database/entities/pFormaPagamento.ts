import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
// import { PVenda } from './pVenda';

@Entity('p_forma_pagamento')
export class PFormaPagamento {
  @PrimaryGeneratedColumn('increment')
  forma_pagamento_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @Column({ type: 'decimal', nullable: true })
  taxa: number;

  // @OneToMany(() => PVenda, (pVenda) => pVenda.forma_pagamento)
  // vendas: PVenda[];
}