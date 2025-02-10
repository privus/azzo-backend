import { Entity, Column, OneToMany, PrimaryColumn } from 'typeorm';
import { Venda } from './venda';

@Entity('status_venda')
export class StatusVenda {
  @PrimaryColumn()
  status_venda_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => Venda, (venda) => venda.status_venda)
  vendas: Venda[];
}
