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
}

export interface WeeklyAid {
  [vendedor: string]: {
    valor_total: number;
    pedidos: number;
    clientes_novos: number;
  };
}

export interface CommissionsReport {

}

  