import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Venda } from './';

@Entity('tipo_envio')
export class TipoEnvio {
  @PrimaryGeneratedColumn('increment')
  tipo_envio_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;

  @OneToMany(() => Venda, (venda) => venda.tipoEnvio)
  vendas: Venda[];
}
