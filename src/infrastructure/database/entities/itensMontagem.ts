import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ItensVenda, Montagem } from '.';

@Entity('itens_montagem')
@Unique(['montagem_id', 'itens_venda_id'])
export class ItensMontagem {
  @PrimaryGeneratedColumn('increment')
  itens_montagem_id: number;

  @Column({ type: 'int' })
  itens_venda_id: number;

  @Column({ type: 'int' })
  montagem_id: number;

  @ManyToOne(() => ItensVenda, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itens_venda_id' })
  itensVenda: ItensVenda;

  @ManyToOne(() => Montagem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'montagem_id' })
  montagem: Montagem;

  @Column({ type: 'int', default: 0 })
  quantidade_bipada: number;
}
