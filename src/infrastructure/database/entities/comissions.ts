import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('comissions')
export class Comissions {
  @PrimaryColumn({ type: 'varchar', length: 40, unique: true })
  codigo: string

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentual: number
}