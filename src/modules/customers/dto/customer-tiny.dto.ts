export interface TinyCustomerResponse {
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

export interface TinyCustomerDto {
    nome: string;
    fantasia: string;
    tipoPessoa: string;
    cpfCnpj: string;
    inscricaoEstadual: string;
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
    situacao: string;
}

