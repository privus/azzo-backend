import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PCliente } from '.';

@Entity('p_status_cliente')
export class PStatusCliente {
  @PrimaryGeneratedColumn('increment')
  status_cliente_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => PCliente, (cliente) => cliente.status_cliente)
  clientes: PCliente[];
}
