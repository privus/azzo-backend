import { Debito } from '../../../infrastructure/database/entities';

export interface StockLiquid {
  codigo: string;
  quantidadeVendida: number;
  saldo_estoque: number;
  estoqueLiquido: number;
  ean: number;
}

export interface StockImportResponse {
  numero_nf: string;
  data_emissao: string;
  emitente: string;
  valor: number;
  qtd_itens: number;
  produtos_nao_encontrados: string;
  produtos: {
    codigo: string;
    nome: string;
    qt_caixa: number;
    quantidade: number;
    valor_total: number;
  }[];
}

export interface Last10OutDto {
  saida_id: number;
  quantidade: number;
  data_saida: string;
  observacao: string;
  produto: {
    nome: string;
    codigo: string;
  };
}

export interface StockDuration {
  produto_id: string;
  mediaDiaria: number;
  diasRestantes: number;
}

export interface StockValue {
  valor_venda: number;
  valor_custo: number;
  percentual_faturamento: number;
}

export interface StockValuePermancence {
  valor_custo: number;
  data: string;
}

export interface StockOverview {
  stockDuration: StockDuration[];
  stockValue: StockValue;
}

export interface Discrepancy {
  produto_id: number;
  codigo: string;
  nome: string;
  historico: number;
  contagem: number;
  diferenca: number;
}

export interface StockInItemDto {
  produto: string;
  codigo: string;
  quantidade_total: number;
  preco_custo_unitario: number;
  data_entrada: Date;
  origem: string;
  valor_total: number;
}
