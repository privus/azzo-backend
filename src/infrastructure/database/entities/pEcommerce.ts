import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PVenda } from './pVenda';

@Entity('p_ecommerce')
export class PEcommerce {
  @PrimaryGeneratedColumn('increment')
  ecommerce_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => PVenda, (pVenda) => pVenda.ecommerce)
  vendas: PVenda[];
}