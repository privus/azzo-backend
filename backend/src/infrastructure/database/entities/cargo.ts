import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Unique } from 'typeorm';
import { Usuario } from './';

@Entity('cargo')
@Unique(['nome'])
export class Cargo {
  @PrimaryGeneratedColumn('increment')
  cargo_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => Usuario, (usuario) => usuario.cargo)
  usuarios: Usuario[];
}
