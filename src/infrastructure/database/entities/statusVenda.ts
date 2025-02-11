import { Entity, Column, OneToMany, PrimaryColumn, ObjectIdColumn, ObjectId } from 'typeorm';
import { Venda } from './venda';

@Entity('status_venda')
export class StatusVenda {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => Venda, (venda) => venda.status_venda)
  vendas: Venda[];
}
