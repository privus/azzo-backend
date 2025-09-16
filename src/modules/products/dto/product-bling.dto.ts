export interface BlingProductResponse {
  id: number;
  nome: string;
  codigo: string;
  preco: number;
  precoCusto: number;
  estoque: {
    saldoVirtualTotal: number;
  };
  tipo: string;
  situacao: string;
  formato: string;
  descricaoCurta: string;
  imagemURL: string;
}

export interface BlingProductDto {
  nome: string;
  tipo: string;
  situacao: string;
  formato: string;
  codigo: string;
  preco: number;
  descricaoCurta: string;
  unidade: string;
  pesoLiquido: number;
  pesoBruto: number;
  gtin: string;
  tipoProducao: string;
  marca: string;
  categoria: {
    id: number;
  };
  actionEstoque: string;
  tributacao: {
    origem: number;
    ncm: string;
    cest: string;
  };
  midia: {
    imagens: {
      imagensURL: { link: string }[];
    };
  };
}

export interface BlingProductApiResponse {
    data: BlingProductResponse[];
}
  
