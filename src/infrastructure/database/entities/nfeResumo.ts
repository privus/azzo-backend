import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('nfe_resumo')
export class NfeResumo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  numero_nfe: string;

  @Column({ type: 'varchar', length: 255 })
  emitente: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  valor_produto: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  valor_ipi: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  valor_st: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  valor_base_icms: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  valor_total_nfe: number;

  @Column({ type: 'timestamp', nullable: true })
  data_emissao: Date;

  @Column({ type: 'timestamp', nullable: true })
  data_entrada: Date;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  valor_icms: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  valor_base_icms_st: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  valor_pis: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  valor_cofins: number;
}
