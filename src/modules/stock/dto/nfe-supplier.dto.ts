export interface NfeSupplierDto {
  cliente: ClienteDto;
  numero: string;
  serie: string;
  chaveAcesso: string;
  dataEmissao: string;
  qtdVolumes: number;
  itens: ItemDto[];
  observacoes: string;
}

export interface ClienteDto {
  id: number;
  nome: string;
}

export interface ItemDto {
  idProduto: number;
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

