import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CategoriaProduto } from './categoriaProduto';
import { Fornecedor } from './fornecedor';

@Entity('produto')
export class Produto {
  @PrimaryGeneratedColumn('increment')
  produto_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @Column({ type: 'int' })
  codigo: number;

  @Column({ type: 'varchar', length: 90, nullable: true })
  descricao: string;

  @Column({ type: 'tinyint', default: 1 })
  ativo: boolean;

  @Column({ type: 'int', nullable: true })
  quantidade: number;

  @Column({ type: 'decimal' })
  preco_venda: number;

  @Column({ type: 'decimal', nullable: true })
  comissao: number;

  @Column({ type: 'int' })
  codigo_ean: number;

  @Column({ type: 'decimal' })
  preco_custo: number;

  @Column({ type: 'int' })
  ncm: number;

  @Column({ type: 'int' })
  cest: number;

  @Column({ type: 'decimal' })
  peso_bruto_kg: number;

  @Column({ type: 'decimal' })
  peso_liquido_kg: number;

  @Column({ type: 'decimal', nullable: true })
  comprimento_cm: number;

  @Column({ type: 'decimal', nullable: true })
  altura_cm: number;

  @Column({ type: 'decimal', nullable: true })
  largura_cm: number;

  @ManyToOne(() => CategoriaProduto)
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaProduto;

  @ManyToOne(() => Fornecedor)
  @JoinColumn({ name: 'fornecedor_id' })
  fornecedor: Fornecedor;
}
