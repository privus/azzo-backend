import { Entity, PrimaryGeneratedColumn, OneToMany, Column } from 'typeorm';
import { Romaneio } from '.';

@Entity('transportadora')
export class Transportadora {
  @PrimaryGeneratedColumn('increment')
  transportadora_id: number;

  @Column({ type: 'varchar', length: 45, unique: true })
  nome: string;

  @OneToMany(() => Romaneio, (romaneio) => romaneio.transportadora)
  romaneios: Romaneio[];
}
