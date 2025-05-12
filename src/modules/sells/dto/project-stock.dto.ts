export interface ProjectStockDto {
  codigo: string;
  nome: string;
  quantidade: number;
  sku: number;
  descricao_uni: string;
  pedidos: number[]; // agora é array
}

