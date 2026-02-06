import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Cliente, Regiao, Vendedor, ParcelaCredito, ItensVenda, StatusVenda, StatusPagamento, TipoPedido, Arquivo, Romaneio } from './';

@Entity('venda')
export class Venda {
  @PrimaryGeneratedColumn('increment')
  venda_id: number;

  @Column({ type: 'int', nullable: false, unique: true })
  codigo: number;

  @Column({ type: 'varchar', nullable: false })
  data_criacao: Date;

  @Column({ type: 'varchar', nullable: true })
  data_atualizacao: Date;

  @Column({ type: 'timestamp', nullable: true })
  itens_atualizacao: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  observacao: string;

  @Column({ type: 'int', nullable: true })
  numero_parcelas: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_parcela: number;

  @Column({ type: 'varchar', length: 180 })
  metodo_pagamento: string;

  @Column({ type: 'varchar', length: 180 })
  forma_pagamento: string;

  @Column('json', { nullable: true })
  datas_vencimento: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_pedido: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_final: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_frete: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  flex_gerado: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  comisao: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  desconto: number;

  @Column({ type: 'int', nullable: true })
  volume: number;

  @Column({ type: 'tinyint', nullable: true })
  exportado: number;

  @Column({ type: 'varchar', length: 180, nullable: true, unique: true })
  chave_acesso: string;

  @Column({ type: 'varchar', length: 180, nullable: true, unique: true })
  nfe_link: string;

  @Column({ type: 'tinyint', nullable: true })
  nfe_emitida: number;

  @Column({ type: 'tinyint', nullable: true })
  anexo: number;

  @Column({ type: 'tinyint', nullable: true })
  fora_politica: number;

  @Column({ type: 'int', nullable: true })
  numero_nfe: number;

  @Column({ type: 'bigint', nullable: true })
  nfe_id: number;

  @Column({ type: 'varchar', nullable: true })
  data_emissao_nfe: Date;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @ManyToOne(() => Vendedor)
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: Vendedor;

  @OneToMany(() => ItensVenda, (item) => item.venda, { cascade: true, onDelete: 'CASCADE' })
  itensVenda: ItensVenda[];

  @ManyToOne(() => Regiao)
  @JoinColumn({ name: 'regiao_id' })
  regiao: Regiao;

  @OneToMany(() => ParcelaCredito, (parcela) => parcela.venda, { cascade: true, onDelete: 'CASCADE' })
  parcela_credito: ParcelaCredito[];  

  @ManyToOne(() => StatusVenda)
  @JoinColumn({ name: 'status_venda_id' })
  status_venda: StatusVenda;

  @ManyToOne(() => StatusPagamento)
  @JoinColumn({ name: 'status_pagamento_id' })
  status_pagamento: StatusPagamento;

  @ManyToOne(() => TipoPedido)
  @JoinColumn({ name: 'tipo_pedido_id' })
  tipo_pedido: TipoPedido;

  @OneToMany(() => Arquivo, (arquivo) => arquivo.venda, { cascade: true })
  arquivos: Arquivo[];

  @ManyToOne(() => Romaneio, (romaneio) => romaneio.vendas, { nullable: true })
  @JoinColumn({ name: 'romaneio_id' })
  romaneio: Romaneio;

  @Column({ type: 'int', nullable: true })
  associado: number;

  @Column({ type: 'bigint', nullable: true })
  bling_id: number;

  @Column({ type: 'int', nullable: true })
  finance_id: number;

  @Column({ type: 'int', nullable: true })
  finance_order_id: number;
}
