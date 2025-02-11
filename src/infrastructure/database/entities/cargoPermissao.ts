import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn, ObjectIdColumn, ObjectId } from 'typeorm';
import { Permissao, Cargo } from './';

@Entity('cargo_permissao')
export class CargoPermissao {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ type: 'int' })
  cargo_id: number;

  @ManyToOne(() => Cargo, (cargo) => cargo.cargoPermissoes, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'cargo_id' })
  cargo: Cargo;

  @Column({ type: 'int' })
  permissao_id: number;

  @ManyToOne(() => Permissao, (permissao) => permissao.cargo_permissoes, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'permissao_id' })
  permissao: Permissao;

  @Column({ type: 'tinyint', default: 0 })
  ler: number;

  @Column({ type: 'tinyint', default: 0 })
  editar: number;

  @Column({ type: 'tinyint', default: 0 })
  criar: number;
}
