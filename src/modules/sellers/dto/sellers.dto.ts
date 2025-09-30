export interface SellerAPIResponse {
  code: number;
  name: string;
  is_active: number;
  region_code: number;
  created_at: Date;
}

export interface GoalsDto {
  vendedor: string;
  mes: number;
  ano: number;
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
