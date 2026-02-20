import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Ecommerce, Produto, Venda } from './';
import { Colaborador } from './colaborador';

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

  @ManyToOne(() => Venda, { nullable: true })
  @JoinColumn({ name: 'venda_id' })
  venda: Venda;

  @ManyToOne(() => Ecommerce, { nullable: true })
  @JoinColumn({ name: 'ecommerce_id' })
  ecommerce: Ecommerce;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observacao: string;

  @ManyToOne(() => Colaborador, { nullable: true })
  @JoinColumn({ name: 'colaborador_id' })
  colaborador: Colaborador;

}
