export interface CustomerAPIResponse {
  code: number;
  name: string;
  company_name: string;
  doc_type: string;
  doc_number: string;
  reg_number: string;
  address_street: string;
  address_number: string;
  address_more: string;
  address_zipcode: string;
  address_district: string;
  address_city: string;
  email_1: string;
  phone_number_1: string;
  phone_number_2: string;
  is_active: number;
  created_at: Date;
  updated_at: Date;
  region_code: number;
  tags: string;
}

export interface TinyResponse {
  nome: string;
  codigo: string;
  fantasia: string;
  tipoPessoa: string;
  cpfCnpj: string;
  inscricaoEstadual: string;
  rg: string;
  telefone: string;
  celular: string;
  email: string;
  endereco: {
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
    municipio: string;
    cep: string;
    uf: string;
    pais: string;
  };
  id: number;
  vendedor: string | null;
  situacao: string;
  dataCriacao: string;
  dataAtualizacao: string;
}
