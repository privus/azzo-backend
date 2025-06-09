import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { CategoriaDebito, ParcelaDebito, StatusPagamento, Departamento, Company, Account } from './';

@Entity('debito')
export class Debito {
  @PrimaryGeneratedColumn('increment')
  debito_id: number;

  @Column({ type: 'int', nullable: true })
  numero_parcelas: number;

  @Column({ type: 'varchar', length: 180, nullable: true })
  nome: string;

  @Column({ type: 'date' })
  data_criacao: Date;

  @Column({ type: 'date', nullable: true, default: null })
  data_competencia: Date;

  @Column({ type: 'date', nullable: true })
  data_pagamento: Date;

  @Column({ type: 'varchar', length: 240, nullable: true })
  descricao: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_parcela: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  juros: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_total: number;

  @Column({ type: 'varchar', length: 180, nullable: true })
  atualizado_por: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  conta: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  empresa: string;

  @Column({ type: 'varchar', length: 180 })
  criado_por: string;

  @Column({ type: 'tinyint', nullable: true })
  despesa_grupo: number;

  @Column('json', { nullable: true })
  datas_vencimento?: string[];

  @OneToMany(() => ParcelaDebito, (parcela) => parcela.debito, { cascade: true, onDelete: 'CASCADE' })
  parcela_debito: ParcelaDebito[];

  @ManyToOne(() => CategoriaDebito)
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaDebito;

  @ManyToOne(() => StatusPagamento)
  @JoinColumn({ name: 'status_pagamento_id' })
  status_pagamento: StatusPagamento;

  @ManyToOne(() => Departamento)
  @JoinColumn({ name: 'departamento_id' })
  departamento: Departamento;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
