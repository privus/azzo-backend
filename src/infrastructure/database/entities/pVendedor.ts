import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PVenda, Venda } from '.';

@Entity('p_vendedor')
export class PVendedor {
  @PrimaryGeneratedColumn('increment')
  vendedor_id: number;

  @Column({ type: 'varchar', length: 90 })
  nome: string;

  @Column({ type: 'tinyint', default: 0, nullable: true })
  ativo: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data_criacao: Date;

  @OneToMany(() => Venda, (venda) => venda.vendedor)
  vendas: PVenda[];
}
