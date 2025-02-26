export interface OrderTinyDto {
    idContato: number;
    numeroOrdemCompra: string;
    meioPagamento: number;
    data: string;
    parcelas: Array<{
        dias: number;
        data: Date;
        valor: number;
    }>;
    itens: Array<{
        produto: {
            id: number;
        };
        quantidade: number;
        valorUnitario: number;
    }>
}