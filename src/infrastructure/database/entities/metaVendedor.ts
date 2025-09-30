import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Vendedor } from './';

@Entity('meta_vendedor')
export class MetaVendedor {
  @PrimaryGeneratedColumn('increment')
  meta_id: number;

  @ManyToOne(() => Vendedor)
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: Vendedor;

  @Column({ type: 'int' })
  mes: number;

  @Column({ type: 'int' })
  ano: number;

  @Column({ type: 'int' })
  meta_ped: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  meta_fat: number;
}
