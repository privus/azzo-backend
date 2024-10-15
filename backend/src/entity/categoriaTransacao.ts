import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Financeiro } from './financeiro';

@Entity('categoria_transacoe')
export class CategoriaTransacao {
  @PrimaryGeneratedColumn('increment')
  categoria_transacoes_id: number;

  @Column({ type: 'tinyint' })
  tipo: boolean;

  @Column({ type: 'varchar', length: 45, nullable: true })
  nome: string;

  @OneToMany(() => Financeiro, (financeiro) => financeiro.categoriaTransacao)
  financeiros: Financeiro[];
}
