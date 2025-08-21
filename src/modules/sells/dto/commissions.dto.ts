export interface Commissions {
  vendedor: string;
  faturado: number;
  pedidos: number;
  comissao: number;
  ticketMedio: number;
  comissaoMedia: number;
}

export interface WeeklyAid {
  [vendedor: string]: {
    valor_total: number;
    pedidos: number;
    clientes_novos: number;
  };
}

  