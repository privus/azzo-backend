import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Estoque, Venda } from './';


@Entity('saida_estoque')
export class SaidaEstoque {
  @PrimaryGeneratedColumn()
  saida_estoque_id: number;

  @Column('int')
  quantidade: number;

  @Column({ type: 'varchar'})
  data_saida: Date;

  @Column('varchar', { length: 20 })
  tipo_saida: string; // 'VENDA', 'DEVOLUCAO', etc

  @Column('decimal', { precision: 10, scale: 2 })
  preco_venda_unitario: number;

  @ManyToOne(() => Estoque, estoque => estoque.saidas)
  @JoinColumn({ name: 'estoque_id' })
  estoque: Estoque;

  @ManyToOne(() => Venda)
  @JoinColumn({ name: 'venda_id' })
  venda: Venda;
}