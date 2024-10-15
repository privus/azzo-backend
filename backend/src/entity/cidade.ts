import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Cliente } from './cliente';
import { Usuario } from './usuario';

@Entity('cidade')
export class Cidade {
  @PrimaryGeneratedColumn('increment')
  cidade_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => Cliente, (cliente) => cliente.cidade)
  clientes: Cliente[];

  @OneToMany(() => Usuario, (usuario) => usuario.cidade)
  usuarios: Usuario[];
}
