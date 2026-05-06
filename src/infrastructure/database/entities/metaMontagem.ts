import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('meta_montagem')
export class MetaMontagem {
  @PrimaryGeneratedColumn('increment')
  meta_id: number;

  @Column({ type: 'int' })
  meta_diaria: number;

  @Column({ type: 'int' })
  meta_realizada: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_acumulado: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_condicional: number;

  @Column({ type: 'decimal', nullable: true })
  qt_sku: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_condicional_ontem: number;

  @Column({ type: 'decimal', nullable: true })
  qt_sku_ontem: number;
}
