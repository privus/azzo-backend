export interface SellerAPIResponse {
  code: number;
  name: string;
  is_active: number;
  region_code: number;
  created_at: Date;
}

export interface GoalsDto {
  vendedor_id: number;
  vendedor: string;
  meta_ped: number;
  meta_fat: number;
  ped_realizados: number;
  fat_realizado: number;
  progress_ped: number;
  progress_fat: number;
}

export interface Goals {
  vendedor_id: number;
  meta_ped: number;
  meta_fat: number;
}

export interface CommissionsReport {
  vendedor_id: number;
  vendedor_nome: string;
  total_valor_final: number;
  total_comisao: number;
  bonus?: number;
  vendas: Array<{
    codigo: number;
    data_criacao: Date;
    valor_final: number;
    comisao: number;
  }>;
}
