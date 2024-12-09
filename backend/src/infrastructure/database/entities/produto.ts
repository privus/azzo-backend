import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CategoriaProduto, Fornecedor } from './';

@Entity('produto')
export class Produto {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int' })
  codigo: number;

  @Column({ type: 'varchar', length: 90, nullable: true })
  name: string;

  @Column({ type: 'tinyint', default: 1, nullable: true })
  ativo: number;

  @Column({ type: 'varchar', length: 90, nullable: true })
  desconto_maximo: number;

  @Column({ type: 'decimal' })
  preco_venda: number;

  @Column({ type: 'decimal' })
  ncm: number;

  @Column({ type: 'decimal' })
  ean: number;

  @Column({ type: 'decimal' })
  preco_custo: number;

  @Column({ type: 'decimal', nullable: true })
  peso_grs: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fotoUrl: string;

  @ManyToOne(() => CategoriaProduto)
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaProduto;

  @ManyToOne(() => Fornecedor, { nullable: true })
  @JoinColumn({ name: 'fornecedor_id' })
  fornecedor: Fornecedor;
}
