export interface MarcaData {
  quantidade: number;
  valor: number;
}
  
export interface VendedorData {
  totalPedidos: number;
  totalFaturado: number;
  marcas: {
      [marca: string]: MarcaData;
  };
}
  
export interface BrandSales {
  [vendedor: string]: VendedorData;
}
