import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Produto, Venda } from './';

@Entity('saida_estoque')
export class SaidaEstoque {
  @PrimaryGeneratedColumn()
  saida_id: number;

  @Column('int')
  quantidade: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data_saida: Date;

  @ManyToOne(() => Produto)
  @JoinColumn({ name: 'produto_id' })
  produto: Produto;

  @ManyToOne(() => Venda)
  @JoinColumn({ name: 'venda_id' })
  venda: Venda;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observacao: string;
}
