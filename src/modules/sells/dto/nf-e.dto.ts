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