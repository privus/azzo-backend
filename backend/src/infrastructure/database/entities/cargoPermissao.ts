import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { Permissao, Cargo } from './';

@Entity('cargo_permissao')
export class CargoPermissao {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Cargo, (cargo) => cargo.cargoPermissoes, { onDelete: 'CASCADE' })
  cargo: Cargo;

  @ManyToOne(() => Permissao, (permissao) => permissao.cargoPermissoes, { onDelete: 'CASCADE' })
  permissao: Permissao;

  @Column({ type: 'tinyint', default: 0 })
  ler: number;

  @Column({ type: 'tinyint', default: 0 })
  editar: number;

  @Column({ type: 'tinyint', default: 0 })
  criar: number;
}
