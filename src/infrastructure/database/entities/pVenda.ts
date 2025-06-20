import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('p_venda')
export class PVenda {
  @PrimaryColumn({type: 'int' })
  p_venda_id: number;

  @Column({ type: 'varchar', nullable: true })
  data_pedido: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_frete: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_pedido: string;

  @Column({ type: 'varchar', length: 90 })
  situacao: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  custo_produtos: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  lucro_pedido: string;

  @Column({ name: 'prioridade', type: 'int' })
  prioridade: number;

  @Column({ type: 'int' })
  numero_tiny: string;

  @Column({ type: 'varchar', length: 50 })
  forma_pagamento: string;

  @Column({ type: 'varchar', length: 180 })
  cliente_nome: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  numero_doc: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  cliente_tipo: string;

  @Column({ type: 'varchar', length: 90 })
  nome_ecommerce: string;
}
