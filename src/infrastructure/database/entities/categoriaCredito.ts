import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ParcelaCredito } from './';

@Entity('categoria_credito')
export class CategoriaCredito {
  @PrimaryGeneratedColumn('increment')
  categoria_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => ParcelaCredito, (ParcelaCredito) => ParcelaCredito.categoria)
  parcelacredito: ParcelaCredito[];
}
