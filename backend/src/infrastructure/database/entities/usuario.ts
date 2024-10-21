import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Cidade } from './cidade';
import { Cargo } from './cargo';
import { Regiao } from './regiao';

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

  @Column({ type: 'varchar', length: 90, nullable: true })
  senha: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  data_nascimento: string;

  @Column({ type: 'varchar', length: 45, unique: true })
  username: string;

  @ManyToOne(() => Cidade, { nullable: true })
  @JoinColumn({ name: 'cidade_id' })
  cidade: Cidade;

  @ManyToOne(() => Cargo, { nullable: true })
  @JoinColumn({ name: 'cargo_id' })
  cargo: Cargo;

  @ManyToOne(() => Regiao, { nullable: true })
  @JoinColumn({ name: 'regiao_id' })
  regiao: Regiao;

  constructor(partial: Partial<Usuario>) {
    Object.assign(this, partial);
  }
}
