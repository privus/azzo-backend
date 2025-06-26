import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Cidade, PStatusCliente } from '.';

@Entity('p_cliente')
export class PCliente {
  @PrimaryGeneratedColumn('increment')
  cliente_id: number;

  @Column({ type: 'int', nullable: true })
  tiny_id: number;

  @Column({ type: 'varchar', length: 240 })
  nome: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  tipo_doc: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  numero_doc: string;

  @Column({ type: 'varchar', length: 90 })
  data_criacao: Date;

  @Column({ type: 'varchar', length: 90, nullable: true })
  ultima_compra: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_ultima_compra: number;

  @Column({ type: 'varchar', length: 180, nullable: true })
  cidade_string: string;

  @ManyToOne(() => Cidade)
  @JoinColumn({ name: 'cidade_id' })
  cidade: Cidade;

  @ManyToOne(() => PStatusCliente)
  @JoinColumn({ name: 'status_cliente_id' })
  status_cliente: PStatusCliente;
}
