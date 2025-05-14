export interface ProjectStockDto {
  codigo: string;
  nome: string;
  sku: number;
  quantidade: number;
  descricao_uni: string;
  pedidos: {
    codigo: number;
    cliente: string;
    data: string; // ou Date
  }[];
}
