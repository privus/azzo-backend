import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Cliente } from './';

@Entity('categoria_cliente')
export class CategoriaCliente {
  @PrimaryGeneratedColumn('increment')
  categoria_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => Cliente, (cliente) => cliente.categoria)
  clientes: Cliente[];
}
