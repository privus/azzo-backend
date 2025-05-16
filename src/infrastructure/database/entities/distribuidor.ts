import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('distribuidor')
export class Distribuidor {
  @PrimaryGeneratedColumn('increment')
  distribuido_id: number;

  @Column({ type: 'varchar', length: 45 })
  nome: string;
}