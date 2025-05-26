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

