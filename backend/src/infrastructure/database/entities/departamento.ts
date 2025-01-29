import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Debito } from './debito';

@Entity('departamento')
export class Departamento {
  @PrimaryGeneratedColumn('increment')
  departamento_id: number;

  @Column({ type: 'varchar', length: 90, unique: true })
  nome: string;

  @OneToMany(() => Debito, (debito) => debito.departamento)
  debitos: Debito[];
}
