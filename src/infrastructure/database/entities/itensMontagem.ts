import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ItensVenda, Montagem } from '.';

@Entity('itens_montagem')
export class ItensMontagem  {
  @PrimaryGeneratedColumn('increment')
  itens_montagem_id: number;

  @ManyToOne(() => ItensVenda, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itens_venda_id' })
  itensVenda: ItensVenda;

  @ManyToOne(() => Montagem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'montagem_id' })
  montagem: Montagem;

  @Column({ type: 'int' })
  quantidade_bipada: number;
}
