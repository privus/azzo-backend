export interface BrandPositivity {
    clientesPositivados: number;
    positivacaoMarca: number;
    contribuicaoPercentual: number;
}

export interface ReportBrandPositivity {
  [vendedor: string]: {
    totalClientes: number;
    clientesPositivados: number;
    positivacaoGeral: number;
    marcas: Record<string, BrandPositivity>;
  };
}

export interface PositivityResponse {
  totalClientes: number;
  clientesPositivados: number;
  positivacaoGeral: number;
}

  