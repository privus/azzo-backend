import { Entity, Column, OneToMany, ObjectIdColumn, ObjectId } from 'typeorm';
import { CargoPermissao } from './';

@Entity('cargo')
export class Cargo {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ type: 'varchar', length: 45, unique: true })
  nome: string;

  @OneToMany(() => CargoPermissao, (cargoPermissao) => cargoPermissao.cargo, { cascade: true })
  cargoPermissoes: CargoPermissao[];
}
