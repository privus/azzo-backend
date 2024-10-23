import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CategoriaCliente, Cidade, StatusCliente } from './';

@Entity('cliente')
export class Cliente {
  @PrimaryGeneratedColumn('increment')
  cliente_id: number;

  @Column({ type: 'varchar', length: 90 })
  nome: string;

  @Column({ type: 'varchar', length: 90 })
  sobrenome: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  cpf: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  cnpj: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  rg: string;

  @Column({ type: 'date', nullable: true })
  data_nascimento: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  senha: string;

  @Column({ type: 'varchar', length: 45, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 45 })
  celular: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  telefone_comercial: string;

  @Column({ type: 'varchar', length: 90, nullable: true })
  info_adicional: string;

  @Column({ type: 'int' })
  cep: number;

  @Column({ type: 'varchar', length: 90, nullable: true })
  endereco: string;

  @Column({ type: 'datetime', nullable: true })
  data_criacao: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  nome_fantasia: string;

  @ManyToOne(() => Cidade)
  @JoinColumn({ name: 'cidade_id' })
  cidade: Cidade;

  @ManyToOne(() => CategoriaCliente)
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaCliente;

  @ManyToOne(() => StatusCliente)
  @JoinColumn({ name: 'status' })
  status: StatusCliente;
}
