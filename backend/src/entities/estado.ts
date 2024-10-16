import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Cidade } from './cidade';

@Entity('estado')
export class Estado {
  @PrimaryGeneratedColumn('increment')
  estado_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @Column({ type: 'varchar', length: 2 })
  sigla: string;

  @OneToMany(() => Cidade, (cidade) => cidade.estado)
  cidade: Cidade[];
}
