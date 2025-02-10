import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { Regiao } from '.';

@Entity('vendedor')
export class Vendedor {
  @PrimaryGeneratedColumn('increment')
  vendedor_id: number;

  @Column({ type: 'varchar', length: 45, unique: true })
  codigo: number;

  @Column({ type: 'varchar', length: 90 })
  nome: string;

  @Column({ type: 'tinyint', default: 0, nullable: true })
  ativo: number;

  @Column({ type: 'varchar', length: 90 })
  data_criacao: Date;

  @ManyToOne(() => Regiao)
  @JoinColumn({ name: 'regiao_id' })
  regiao: Regiao;
}
