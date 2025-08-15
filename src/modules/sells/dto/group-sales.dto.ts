export interface CustomerGroupSalesDto {
    clienteCodigo: number;
    clienteNome: string;
    totalValor: number;      // soma apenas dos itens do fornecedorId
    pedidos: number[];       // códigos dos pedidos (únicos)
  }
  
  export interface GroupSalesResponse {
    groupTotal: number;
    clientes: CustomerGroupSalesDto[];
  }