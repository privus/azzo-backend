import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CargoPermissao } from './';

@Entity('permissoes')
export class Permissao {
  @PrimaryGeneratedColumn('increment')
  permissao_id: number;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @OneToMany(() => CargoPermissao, (cargoPermissao) => cargoPermissao.permissao, { cascade: true })
  cargoPermissoes: CargoPermissao[];
}
