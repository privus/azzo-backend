import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Cliente, Regiao, Vendedor, ParcelaCredito, ItensVenda, StatusVenda } from './';

@Entity('venda')
export class Venda {
  @PrimaryGeneratedColumn('increment')
  venda_id: number;

  @Column({ type: 'int', nullable: false, unique: true })
  codigo: number;

  @Column({ type: 'date' })
  data_criacao: Date;

  @Column({ type: 'varchar', length: 240, nullable: true })
  observacao: string;

  @Column({ type: 'int', nullable: true })
  numero_parcelas: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_parcela: number;

  @Column({ type: 'varchar', length: 180 })
  metodo_pagamento: string;

  @Column({ type: 'varchar', length: 180 })
  status_string: string;

  @Column({ type: 'varchar', length: 180 })
  forma_pagamento: string;

  @Column({ type: 'varchar', length: 180 })
  datas_vencimento: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_total: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  desconto: number;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @ManyToOne(() => Vendedor)
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: Vendedor;

  @OneToMany(() => ItensVenda, (vp) => vp.venda, { cascade: true })
  itensVenda: ItensVenda[];

  @ManyToOne(() => Regiao)
  @JoinColumn({ name: 'regiao_id' })
  regiao: Regiao;

  @OneToMany(() => ParcelaCredito, (parcela) => parcela.venda, { cascade: true })
  parcela: ParcelaCredito[];

  @ManyToOne(() => StatusVenda)
  @JoinColumn({ name: 'status_venda_id' })
  status_venda: StatusVenda;
}
