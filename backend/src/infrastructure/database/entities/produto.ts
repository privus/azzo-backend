import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CategoriaProduto, Fornecedor } from './';

@Entity('produto')
export class Produto {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int', unique: true })
  codigo: number;

  @Column({ type: 'varchar', length: 90, nullable: true })
  nome: string;

  @Column({ type: 'tinyint', default: 1, nullable: true })
  ativo: number;

  @Column({ type: 'varchar', length: 90, nullable: true })
  desconto_maximo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  preco_venda: number;

  @Column({ type: 'varchar', length: 90, nullable: true })
  ncm: string;

  @Column({ type: 'varchar', length: 90, nullable: true })
  ean: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
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
