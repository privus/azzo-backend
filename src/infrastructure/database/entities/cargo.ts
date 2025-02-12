import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CargoPermissao } from './';

@Entity('cargo')
export class Cargo {
  @PrimaryGeneratedColumn('increment')
  cargo_id: number;

  @Column({ type: 'varchar', length: 45, unique: true })
  nome: string;

  @OneToMany(() => CargoPermissao, (cargoPermissao) => cargoPermissao.cargo, { cascade: true })
  cargoPermissoes: CargoPermissao[];
}
