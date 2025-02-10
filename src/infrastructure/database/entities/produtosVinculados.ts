import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { KitProdutosVinculados } from './';

@Entity('produtos_vinculados')
export class ProdutosVinculados {
  @PrimaryGeneratedColumn('increment')
  produtos_vinculados_id: number;

  @Column({ type: 'varchar', length: 45, nullable: true })
  nome: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  preco: string;

  @OneToMany(() => KitProdutosVinculados, (kit) => kit.produtosVinculados)
  kits: KitProdutosVinculados[];
}
