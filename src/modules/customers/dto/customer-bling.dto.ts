export interface EnderecoBling {
  endereco: string;
  cep: string;
  bairro: string;
  municipio: string;
  uf: string;
  numero: string;
  complemento: string;
}

export interface EnderecosBling {
  geral: EnderecoBling;
  cobranca: EnderecoBling;
}

export interface CustomerBlingDto {
  nome: string;
  codigo: string;
  situacao: string;
  numeroDocumento: string;
  celular: string;
  fantasia: string;
  tipo: string;
  ie: string;
  email: string;
  endereco: EnderecosBling;
}
