export interface ProjectStockDto {
  codigo: string;
  nome: string;
  sku: string;
  quantidade: number;
  descricao_uni: string;
  pedidos: {
    codigo: number;
    cliente: string;
    data: string; // ou Date
  }[];
}
