import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('p_sell')
export class PSell {  
  @PrimaryGeneratedColumn('increment')
  p_venda_id: number;

  @Column({ type: 'bigint', nullable: false, unique: true })
  codigo: number;

  @Column({ type: 'date' })
  data_pedido: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  total_pedido: number;

  @Column({ type: 'bigint', nullable: true, unique: true })
  cod_omie: number;

  @Column({ type: 'bigint', nullable: true, unique: true })
  cod_bling: number;

  @Column({ type: 'bigint', nullable: true })
  cliente_cod_bling: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cliente_nome: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  numero_doc: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cliente_tipo: string;

  @Column({ type: 'int', nullable: true })
  status_id: number;

  @Column({ type: 'int', nullable: true })
  n_ecommerce: number;

  @Column({ type: 'tinyint', nullable: true, default: 0 })
  boleto_faturado: number;
}
