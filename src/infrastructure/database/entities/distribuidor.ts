import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('distribuidor')
export class Distribuidor {
  @PrimaryGeneratedColumn('increment')
  distribuidor_id: number;

  @Column({ type: 'varchar', length: 45, nullable: true })
  cnpj: string;

  @Column({ type: 'varchar', length: 45 })
  nome: string;
}