import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PProduto, PVenda } from '.';

@Entity('p_itens_venda')
export class PItensVenda {
  @PrimaryGeneratedColumn('increment')
  itens_venda_id: number;

  @Column({ type: 'int' })
  quantidade: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_unitario: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_total: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  lucro_bruto: number;

  @Column({ type: 'varchar', length: 180, nullable: true })
  observacao: string;

  @ManyToOne(() => PVenda, (venda) => venda.itensVenda, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venda_id' })
  venda: PVenda;

  @ManyToOne(() => PProduto)
  @JoinColumn({ name: 'produto_id' })
  produto: PProduto;
}
