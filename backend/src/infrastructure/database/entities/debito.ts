import { Entity, PrimaryGeneratedColumn, OneToMany, Column } from 'typeorm';
import { Transacao } from './';

@Entity('debito')
export class Debito {
  @PrimaryGeneratedColumn('increment')
  debito_id: number;

  @Column({ type: 'int', nullable: true })
  total_parcelas?: number;

  @OneToMany(() => Transacao, (transacao) => transacao.debito)
  transacoes: Transacao[];
}
