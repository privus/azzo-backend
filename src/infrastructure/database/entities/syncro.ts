import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('syncro')
export class Syncro {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  module_name: string;

  @Column({ type: 'timestamp', nullable: true })
  last_sync: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_update: Date;
}
