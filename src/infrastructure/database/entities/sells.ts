import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('p_sell')
export class PSell {
  
  @PrimaryGeneratedColumn('increment')
  sell_id: number;

  @Column({ type: 'int' })
  p_venda_id: number;

  @Column({ type: 'date' })
  data_pedido: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_frete: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  total_pedido: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  custo_produtos: number;

  @Column({ type: 'int', nullable: true })
  prioridade: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  numero_tiny: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  forma_pagamento: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cliente_nome: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  numero_doc: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cliente_tipo: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  situacao: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nome_ecommerce: string;

  @Column({ type: 'json', nullable: true })
  produtos: any;
}
