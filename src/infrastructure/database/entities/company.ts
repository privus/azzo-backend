import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('company')
export class Company {
  @PrimaryGeneratedColumn()
  company_id: number;

  @Column({ type: 'varchar', length: 80 })
  nome: string;

  @Column({ type: 'varchar', length: 14, nullable: true }) 
  cnpj: string;  
}
