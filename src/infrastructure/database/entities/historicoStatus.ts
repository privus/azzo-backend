import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from 'typeorm';
import { Regiao } from './';

@Entity('historico_status')
export class HistoricoStatus {
  @PrimaryGeneratedColumn('increment')
  historico_status_id: number;

  @Column({ type: 'int' })
  ativo: number;

  @Column({ type: 'int' })
  frio: number;

  @Column({ type: 'int' })
  atencao: number;

  @Column({ type: 'int' })
  inativo: number;

  @ManyToOne(() => Regiao)
  @JoinColumn({ name: 'regiao_id' })
  regiao: Regiao;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data_registro: Date;
}

