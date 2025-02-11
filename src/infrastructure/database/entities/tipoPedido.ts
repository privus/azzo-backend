import { Entity, Column, OneToMany, PrimaryColumn, ObjectIdColumn, ObjectId } from 'typeorm';
import { Venda } from './venda';

@Entity('tipo_pedido')
export class TipoPedido {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ type: 'varchar', length: 180 })
  nome: string;

  @OneToMany(() => Venda, (venda) => venda.tipo_pedido)
  vendas: Venda[];
}
