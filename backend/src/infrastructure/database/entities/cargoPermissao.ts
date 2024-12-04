import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from 'typeorm';
import { Permissao, Cargo } from './';

@Entity('cargo_permissao')
export class CargoPermissao {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'cargo_id', type: 'int' })
  cargo_id: number;

  @ManyToOne(() => Cargo, (cargo) => cargo.cargoPermissoes, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'cargo_id' })
  cargo: Cargo;

  @Column({ name: 'permissao_id', type: 'int' })
  permissao_id: number;

  @ManyToOne(() => Permissao, (permissao) => permissao.cargoPermissoes, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'permissao_id' })
  permissao: Permissao;

  @Column({ type: 'tinyint', default: 0 })
  ler: number;

  @Column({ type: 'tinyint', default: 0 })
  editar: number;

  @Column({ type: 'tinyint', default: 0 })
  criar: number;
}
