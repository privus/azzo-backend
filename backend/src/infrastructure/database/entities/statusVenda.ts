import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Venda } from './venda';

@Entity('status_venda')
export class StatusVenda {
  @PrimaryGeneratedColumn('increment')
  status_venda_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => Venda, (venda) => venda.status_venda)
  vendas: Venda[];
}
