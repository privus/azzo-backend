export interface OrderAssemblyState {
    codigoPedido: number;
    itens: Array<{
      produtoId: number;
      nome: string;
      ean: string;
      quantidadePedida: number;
      quantidadeBipada: number;
      status: 'montado' | 'pendente';
    }>;
    finalizado: boolean;
  }
  