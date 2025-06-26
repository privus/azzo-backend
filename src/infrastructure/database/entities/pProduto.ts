import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PItensVenda } from '.';

@Entity('p_produtos')
export class PProduto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  preco: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  codigo: string;

  @OneToMany(() => PItensVenda, (vp) => vp.produto, { cascade: true })
  itens_venda: PItensVenda[];
}
