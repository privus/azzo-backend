export interface OrdeBlingDto {
  data: string;
  contato: {
    id: number;
  };
  situacao: {
    id: number;
  };
  numeroPedidoCompra: string;
  observacoes: string;
  categoria: {
    id: number;
  };
  itens: Array<{
    unidade: string;
    quantidade: number;
    desconto: number;
    valor: number;
    descricao: string;
    produto: {
      id: number;
    };
  }>;
  transporte: {
    quantidadeVolumes: number;
  };
}