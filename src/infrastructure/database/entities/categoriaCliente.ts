import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ObjectIdColumn, ObjectId } from 'typeorm';
import { Cliente } from './';

@Entity('categoria_cliente')
export class CategoriaCliente {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => Cliente, (cliente) => cliente.categoria)
  clientes: Cliente[];
}
