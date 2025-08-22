import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Distribuidor, Fornecedor, Produto } from './';
  
@Entity('estoque')
export class Estoque {
  @PrimaryGeneratedColumn()
  estoque_id: number;  
  
  @Column('int')
  quantidade_total: number;
  
  @Column('varchar', { length: 20 })
  origem: string; // 'NFE', 'AJUSTE', etc
  
  @Column({ type: 'varchar', nullable: false })
  data_entrada: Date;
  
  @Column('varchar', { nullable: true })
  numero_nfe: string;
  
  @Column('decimal', { precision: 10, scale: 2 })
  preco_custo_unitario: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_total: number;
  
  @ManyToOne(() => Produto)
  @JoinColumn({ name: 'produto_id' })
  produto: Produto;

  @ManyToOne(() => Fornecedor)
  @JoinColumn({ name: 'fornecedor_id' })
  fornecedor: Fornecedor;

  @ManyToOne(() => Distribuidor)
  @JoinColumn({ name: 'distribuidor_id' })
  distribuidor: Distribuidor;
}