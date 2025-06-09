import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '.';

@Entity('account')
export class Account {
  @PrimaryGeneratedColumn()
  account_id: number;

  @Column({ type: 'varchar', length: 80 })
  nome: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
