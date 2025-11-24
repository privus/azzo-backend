export interface OrdersBlingResponseDto {
  id: number;
  numero: number;
  numeroLoja: string;
  data: string;
  totalProdutos: number;
  total: number;
  contato: {
    id: number;
    nome: string;
    tipoPessoa: string;
    numeroDocumento: string;
  };
  situacao: {
    id: number;
    valor: number;
  };
  loja: {
    id: number;
  };
}

export interface OrderBlingResponseDto {
  id: number;
  numero: number;
  numeroLoja: string;
  data: string;
  total: number;
  contato: {
    id: number;
    nome: string;
    tipoPessoa: string;
    numeroDocumento: string;
  };
  situacao: {
    id: number;
    valor: number;
  };
  loja: {
    id: number;
  };
  notaFiscal: {
    id: number;
  };
  itens: Array<{
    id: number;
    codigo: string;
    unidade: string;
    quantidade: number;
    desconto: number;
    valor: number;
    descricao: string;
    produto: {
      id: number;
    };
  }>;
}