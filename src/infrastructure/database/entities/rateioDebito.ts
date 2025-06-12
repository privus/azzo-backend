import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Debito, Company } from '.'

@Entity('rateio_debito')
export class RateioDebito {
  @PrimaryGeneratedColumn()
  rateio_id: number;

  @ManyToOne(() => Debito)
  @JoinColumn({ name: 'debito_id' })
  debito: Debito;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: number;
}
