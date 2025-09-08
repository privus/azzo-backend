export interface RakingSellsResponse {
    today: RankingItem[];
    yesterday: RankingItem[];
}

export interface RankingItem {
    id: number;
    nome: string;
    total: number;
    numero_vendas: number;
    codigos_vendas: number[];
    pureli: number;
}

export interface customerRanking {
    id: number;
    nome: string;
    total: number;
    numero_vendas: number;
}