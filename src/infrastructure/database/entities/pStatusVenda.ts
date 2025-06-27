import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PVenda, Venda } from './';

@Entity('p_status_venda')
export class StatusVenda {
  @PrimaryGeneratedColumn('increment')
  status_venda_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => PVenda, (venda) => venda.status_venda)
  vendas: PVenda[];
}

