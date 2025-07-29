import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ItensMontagem } from '.';

@Entity('montagem')
export class Montagem {
  @PrimaryGeneratedColumn('increment')
  montagem_id: number;

  @Column({ type: 'varchar', length: 20, default: 'nao_iniciada' })
  status: 'iniciada' | 'pausada' | 'finalizada' | 'nao_iniciada';

  @Column({ type: 'varchar', length: 90, nullable: true })
  responsavel: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data_inicio: Date;

  @Column({ type: 'timestamp', nullable: true })
  data_fim: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  motivo_pausa: string;

  @OneToMany(() => ItensMontagem, (itensMontagem) => itensMontagem.montagem)
  itensMontagem: ItensMontagem[];
}
