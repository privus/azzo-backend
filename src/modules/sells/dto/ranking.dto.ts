export interface RakingSellsResponse {
    today: RankingItem[];
    yesterday: RankingItem[];
}

export interface RankingItem {
    nome: string;
    total: number;
    numero_vendas: number;
    codigos_vendas: number[];
}
