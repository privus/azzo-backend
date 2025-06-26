import { Entity, Column, OneToMany, PrimaryColumn } from 'typeorm';
import { PVenda } from './';

@Entity('status_venda')
export class PStatusVenda {
  @PrimaryColumn()
  status_venda_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => PVenda, (venda) => venda.status_venda)
  vendas: PVenda[];
}
