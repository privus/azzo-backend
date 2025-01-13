import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { CategoriaDebito, ParcelaDebito } from './';

@Entity('debito')
export class Debito {
  @PrimaryGeneratedColumn('increment')
  debito_id: number;

  @Column({ type: 'int', nullable: true })
  numero_parcelas: number;

  @Column({ type: 'date' })
  data_criacao: Date;

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
  metodo_pagamento: string;

  @Column('simple-json', { nullable: true })
  datas_vencimento?: string[][];

  @OneToMany(() => ParcelaDebito, (parcela) => parcela.debito, { cascade: true })
  parcela: ParcelaDebito[];

  @ManyToOne(() => CategoriaDebito, (categoria) => categoria.debitos)
  categoria: CategoriaDebito;
}
