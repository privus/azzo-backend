import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Venda } from './';

@Entity('canal_venda')
export class CanalVenda {
  @PrimaryGeneratedColumn('increment')
  canal_venda_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => Venda, (venda) => venda.canalVenda)
  vendas: Venda[];
}
