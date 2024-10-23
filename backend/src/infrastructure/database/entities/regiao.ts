import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Cidade, Usuario } from './';

@Entity('regiao')
export class Regiao {
  @PrimaryGeneratedColumn('increment')
  regiao_id: number;

  @Column({ type: 'varchar', length: 90 })
  nome: string;

  @OneToMany(() => Cidade, (cidade) => cidade.regiao)
  cidades: Cidade[];

  @OneToMany(() => Usuario, (cidade) => cidade.regiao)
  usuarios: Usuario[];
}
