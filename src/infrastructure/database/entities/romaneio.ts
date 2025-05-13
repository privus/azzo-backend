import { Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Transportadora, Venda } from '.';

@Entity('romaneio')
export class Romaneio {
  @PrimaryGeneratedColumn('increment')
  romaneio_id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data_criacao: Date;

  @ManyToOne(() => Transportadora)
  @JoinColumn({ name: 'transportadora_id' })
  transportadora: Transportadora;

  @OneToMany(() => Venda, (venda) => venda.romaneio)
  vendas: Venda[];
}
