export interface CustomerGroupSalesDto {
    clienteCodigo: number;
    clienteNome: string;
    totalValor: number;
    pedidos: number[];
    linksNfe: string[];
  }
  
  export interface GroupSalesResponse {
    groupTotal: number;
    clientes: CustomerGroupSalesDto[];
  }