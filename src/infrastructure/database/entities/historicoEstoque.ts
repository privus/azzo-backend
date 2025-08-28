import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Produto } from '.';

@Entity('historico_estoque')
export class HistoricoEstoque {
  @PrimaryGeneratedColumn()
  historico_id: number;

  @Column({ type: 'int' })
  produto_id: number;

  @Column({ type: 'int' })
  quantidade: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data_contagem: Date;

  @ManyToOne(() => Produto)
  @JoinColumn({ name: 'produto_id' })
  produto: Produto;
}
