import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Montagem, Produto, Venda, ItensMontagem } from '.';

@Entity('itens_venda')
export class ItensVenda {
  @PrimaryGeneratedColumn('increment')
  itens_venda_id: number;

  @Column({ type: 'int', default: 1 })
  quantidade: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_unitario: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_total: number;

  @Column({ type: 'varchar', length: 180, nullable: true })
  observacao: string;

  @ManyToOne(() => Venda, (venda) => venda.itensVenda, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venda_id' })
  venda: Venda;

  @ManyToOne(() => Produto)
  @JoinColumn({ name: 'produto_id' })
  produto: Produto;

  @OneToMany(() => ItensMontagem, (itensMontagem) => itensMontagem.itensVenda)
  itensMontagem: ItensMontagem[];
}
