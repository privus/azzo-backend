import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { CategoriaProduto, Fornecedor, ItensVenda } from './';

@Entity('produto')
export class Produto {
  @PrimaryGeneratedColumn('increment')
  produto_id: number;

  @Column({ type: 'int'})
  sellent_id: number;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 90, nullable: true })
  nome: string;

  @Column({ type: 'tinyint', default: 0, nullable: true })
  ativo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  preco_venda: number;

  @Column({ type: 'int', nullable: true })
  ncm: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ean: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  preco_custo: number;

  @Column({ type: 'decimal', nullable: true })
  peso_grs: number;

  @Column('int', { default: 0 })
  saldo_estoque: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fotoUrl: string;

  @Column({ type: 'varchar', length: 90 })
  data_criacao: Date;

  @Column({ type: 'varchar', length: 90 })
  data_atualizacao: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descricao_uni: string;

  @Column({ type: 'int', nullable: true })
  tiny_sp: number;

  @Column({ type: 'int', nullable: true })
  tiny_mg: number;

  @Column({ type: 'int', nullable: true })
  qt_uni: number;

  @Column({ type: 'int', nullable: true })
  estoque_minimo: number;

  @ManyToOne(() => CategoriaProduto)
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaProduto;

  @ManyToOne(() => Fornecedor, { nullable: true })
  @JoinColumn({ name: 'fornecedor_id' })
  fornecedor: Fornecedor;

  @OneToMany(() => ItensVenda, (vp) => vp.produto, { cascade: true })
  itens_venda: ItensVenda[];

  @OneToOne(() => Produto, { nullable: true })
  @JoinColumn({ name: 'unidade_id' })
  unidade: Produto;  

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  altura: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  largura: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  comprimento: number;

  @Column({ type: 'varchar', length: 40, nullable: true })
  cest: string;

  @Column({ type: 'bigint', nullable: true })
  bling_id: number;
}
