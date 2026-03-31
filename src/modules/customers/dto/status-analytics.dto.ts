export interface StatusAnalyticsDTO {
  ativo: number;
  frio: number;
  atencao: number;
  inativo: number;
  regiao_id: number;
}

export interface StatusByRegion {
  regiao_id: number;
  regiao_nome: string;
  ativo: number;
  frio: number;
  atencao: number;
  inativo: number;
}

export interface StatusRecordeDTO {
  atual: number;
  record: number;
  bateu_recorde: boolean;
  regiao_id: number;
}