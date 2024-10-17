import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Cidade } from './cidade';
import { Cargo } from './cargo';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn('increment')
  usuario_id: number;

  @Column({ type: 'varchar', length: 90 })
  nome: string;

  @Column({ type: 'varchar', length: 45, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  celular: string;

  @Column({ type: 'varchar', length: 90 })
  endereco: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  senha: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  data_nascimento: string;

  @Column({ type: 'varchar', length: 45 })
  username: string;

  @ManyToOne(() => Cidade)
  @JoinColumn({ name: 'cidade_id' })
  cidade: Cidade;

  @ManyToOne(() => Cargo)
  @JoinColumn({ name: 'cargo_id' })
  cargo: Cargo;
}
