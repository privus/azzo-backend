export interface Commissions {
  vendedor_id: number;
  vendedor: string;
  faturado: number;
  pedidos: number;
  comissao: number;
  ticketMedio: number;
  meta_ped?: number;
  meta_fat?: number;
  progresso_ped?: number;
  progresso_fat?: number;
  bonificado?: number;
}

export interface WeeklyAid {
  [vendedor: string]: {
    valor_total: number;
    pedidos: number;
    clientes_novos: number;
  };
}

export interface WeeklyAidDetails {
  [vendedor: string]: {
    valor_total: number;
    pedidos: number;
    clientes_novos: number;

    pedidos_30: number[];
    pedidos_50: number[];

    invalidos_valor: number[];
    invalidos_intervalo: number[];
  };
}
  