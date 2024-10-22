import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Produto } from './produto';

@Entity('fornecedor')
export class Fornecedor {
  @PrimaryGeneratedColumn('increment')
  fornecedor_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @Column({ type: 'decimal', nullable: true })
  comissao: number;

  @OneToMany(() => Produto, (produto) => produto.fornecedor)
  produtos: Produto[];
}
