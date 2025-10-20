import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Produto } from './';

@Entity('fornecedor')
export class Fornecedor {
  @PrimaryGeneratedColumn('increment')
  fornecedor_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @Column({ type: 'varchar', length: 90 })
  razao_social: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  cnpj: string;

  @OneToMany(() => Produto, (produto) => produto.fornecedor)
  produtos: Produto[];
}
