import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Venda } from './venda';

@Entity('status_envio')
export class StatusEnvio {
  @PrimaryGeneratedColumn('increment')
  status_envio_id: number;

  @Column({ type: 'varchar', length: 45, nullable: true })
  nome: string;

  @OneToMany(() => Venda, (venda) => venda.statusEnvio)
  vendas: Venda[];
}
