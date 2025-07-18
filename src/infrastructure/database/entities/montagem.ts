import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ItensVenda } from './itensVenda';

@Entity('montagem')
export class Montagem {
  @PrimaryGeneratedColumn('increment')
  montagem_id: number;

	@Column({ type: 'varchar', length: 20 })
	status: 'iniciada' | 'pausada' | 'finalizada';	

  @Column({ type: 'varchar', length: 90, nullable: true })
  responsavel: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data_inicio: Date;

  @Column({ type: 'timestamp', nullable: true })
  data_fim: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  motivo_pausa: string;

  @OneToMany(() => ItensVenda, (itensVenda) => itensVenda.montagem)
  itensVenda: ItensVenda[];
}
