import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Produto, Venda } from '.';

@Entity('itens_venda')
export class ItensVenda {
  @PrimaryGeneratedColumn('increment')
  itens_venda_id: number;

  @Column({ type: 'int' })
  quantidade: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_unitario: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_total: number;

  @ManyToOne(() => Venda, (venda) => venda.itensVenda, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venda_id' })
  venda: Venda;

  @ManyToOne(() => Produto)
  @JoinColumn({ name: 'produto_id' })
  produto: Produto;
}
