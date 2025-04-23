import { ClienteTiny } from './';

export interface InvoiceTinyDto {
    situacao: string;
    data: string;
    dataVencimento: string;
    historico: string;
    valor: number;
    numeroDocumento: string;
    numeroBanco: string;
    serieDocumento: string;
    cliente: ClienteTiny
}