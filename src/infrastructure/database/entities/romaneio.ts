import { Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Transportadora, Venda } from '.';

@Entity('romaneio')
export class Romaneio {
  @PrimaryGeneratedColumn('increment')
  romaneio_id: number;

  @Column({ type: 'varchar', nullable: false })
  data_criacao: Date;

  @Column({ type: 'varchar', length: 90, nullable: true })
  cod_rastreio: string;

  @ManyToOne(() => Transportadora)
  @JoinColumn({ name: 'transportadora_id' })
  transportadora: Transportadora;

  @OneToMany(() => Venda, (venda) => venda.romaneio)
  vendas: Venda[];
}
