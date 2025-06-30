import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { PEcommerce, PCliente, PFormaPagamento, PParcelaCredito, PItensVenda, StatusPagamento, PVendedor } from './';
import { PStatusVenda } from './pStatusVenda';


@Entity('p_venda')
export class PVenda {
  @PrimaryGeneratedColumn('increment')
  venda_id: number;

  @Column({ type: 'varchar', nullable: false })
  data_criacao: Date;

  @Column({ type: 'varchar', nullable: true })
  data_atualizacao: Date;

  @Column({ type: 'varchar', length: 480, nullable: true })
  observacao: string;

  @Column({ type: 'int', nullable: true })
  numero_parcelas: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_parcela: number;

  @Column('json', { nullable: true })
  datas_vencimento: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_pedido: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_final: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_frete: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  desconto: number;

  @Column({ type: 'tinyint', nullable: true })
  exportado: number;

  @Column({ type: 'varchar', length: 180, nullable: true, unique: true })
  chave_acesso: string;

  @Column({ type: 'varchar', length: 180, nullable: true, unique: true })
  nfe_link: string;

  @Column({ type: 'tinyint', nullable: true })
  nfe_emitida: number;

  @Column({ type: 'int', nullable: true })
  numero_nfe: number;

  @Column({ type: 'int', nullable: true })
  numero_tiny: number;

  @Column({ type: 'int', nullable: true })
  nfe_id: number;

  @Column({ type: 'varchar', nullable: true })
  data_emissao_nfe: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fonte_lead: string;

  @ManyToOne(() => PEcommerce)
  @JoinColumn({ name: 'ecommerce_id' })
  ecommerce: PEcommerce

  @ManyToOne(() => PCliente)
  @JoinColumn({ name: 'cliente_id' })
  cliente: PCliente;

  @ManyToOne(() => PFormaPagamento)
  @JoinColumn({ name: 'forma_de_pagamento_id' })
  forma_pagamento: PFormaPagamento;

  @OneToMany(() => PItensVenda, (item) => item.venda, { cascade: true, onDelete: 'CASCADE' })
  itensVenda: PItensVenda[];  

  // Esta entidade não será preenchida de imediato
  @OneToMany(() => PParcelaCredito, (parcela) => parcela.venda, { cascade: true, onDelete: 'CASCADE' })
  parcela_credito?: PParcelaCredito[];  

  @ManyToOne(() => PStatusVenda)
  @JoinColumn({ name: 'status_venda_id' })
  status_venda: PStatusVenda;

  @ManyToOne(() => StatusPagamento)
  @JoinColumn({ name: 'status_pagamento_id' })
  status_pagamento: StatusPagamento;

  @ManyToOne(() => PVendedor)
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: PVendedor;

}
