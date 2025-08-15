import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Cliente } from './cliente';

@Entity('grupo_cliente')
export class GrupoCliente {
  @PrimaryGeneratedColumn('increment')
  grupo_cliente_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => Cliente, (cliente) => cliente.grupo)
  clientes: Cliente[];
}
