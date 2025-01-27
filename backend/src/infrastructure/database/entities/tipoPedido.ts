import { Entity, Column, OneToMany, PrimaryColumn } from 'typeorm';
import { Venda } from './venda';

@Entity('tipo_pedido')
export class TipoPedido {
  @PrimaryColumn()
  tipo_pedido_id: number;

  @Column({ type: 'varchar', length: 180 })
  nome: string;

  @OneToMany(() => Venda, (venda) => venda.tipo_pedido)
  vendas: Venda[];
}
