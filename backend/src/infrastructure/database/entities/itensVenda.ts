import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Venda, Produto } from './';

@Entity('itens_venda')
export class ItensVenda {
  @PrimaryGeneratedColumn('increment')
  itens_venda_id: number;

  @Column({ type: 'int' })
  venda_id: number;

  @Column({ type: 'int' })
  produto_id: number;

  @Column({ type: 'int' })
  quantidade: number;

  @Column({ type: 'decimal' })
  preco_unitario: number;

  @ManyToOne(() => Venda)
  @JoinColumn({ name: 'venda_id' })
  venda: Venda;

  @ManyToOne(() => Produto)
  @JoinColumn({ name: 'produto_id' })
  produto: Produto;
}
