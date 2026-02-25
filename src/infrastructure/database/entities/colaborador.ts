import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('colaborador')
export class Colaborador {
  @PrimaryGeneratedColumn('increment')
  colaborador_id: number;

  @Column({ type: 'varchar', length: 90 })
  nome: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor: number;
}
