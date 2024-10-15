import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Produto } from './produto';

@Entity('categoria_produto')
export class CategoriaProduto {
  @PrimaryGeneratedColumn('increment')
  categoria_produto_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => Produto, (produto) => produto.categoria)
  produtos: Produto[];
}
