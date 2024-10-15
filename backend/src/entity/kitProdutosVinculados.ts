import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Produto } from './produto';
import { ProdutosVinculados } from './produtosVinculados';

@Entity('kit_produtos_vinculados')
export class KitProdutosVinculados {
  @PrimaryGeneratedColumn('increment')
  kit_produtos_vinculados_id: number;

  @Column({ type: 'int' })
  produto_id: number;

  @Column({ type: 'int' })
  produtos_vinculados_id: number;

  @Column({ type: 'int' })
  quantidade: number;

  @ManyToOne(() => Produto)
  @JoinColumn({ name: 'produto_id' })
  produto: Produto;

  @ManyToOne(() => ProdutosVinculados)
  @JoinColumn({ name: 'produtos_vinculados_id' })
  produtosVinculados: ProdutosVinculados;
}
