export interface NfeDto {
    situacao: string;
    chaveAcesso: string;
    cliente: ClienteTiny
    valor: number;
    numero: string;
    dataEmissao: string;
    id: number;
}

export interface ClienteTiny {
    id: number;
    nome: string;
    codigo: string;
    tipoPessoa: string;
    cpfCnpj: string;
}

export interface NfeBlingDTO {
    id: number;
    tipo: number;
    situacao: number;
    numero: string;
    dataEmissao: string;
    dataOperacao: string;
    chaveAcesso: string;
    contato: {
        id: number;
        nome: string;
        numeroDocumento: string;
        ie: string;
        rg: string;
        telefone: string;
        email: string;
        endereco: {
            endereco: string;
            numero: string;
            complemento: string;
            bairro: string;
            cep: string;
            municipio: string;
            uf: string;
        };
    };
    naturezaOperacao: {
        id: number;
    };
    loja: {
        id: number;
    };
}
