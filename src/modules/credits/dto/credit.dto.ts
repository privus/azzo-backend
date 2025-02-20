import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreditDto {
    /**
     * Nome do crédito.
     * Exemplo: "Crédito Exemplo"
     */
    @IsString({ message: 'O nome deve ser uma string.' })
    nome: string;

    /**
     * Descrição do crédito.
     * Exemplo: "Descrição do crédito exemplo"
     */
    @IsString({ message: 'A descrição deve ser uma string.' })
    descricao: string;

    /**
     * Nome da categoria.
     * Exemplo: "Categoria Exemplo"
     */
    @IsString({ message: 'O nome da categoria deve ser uma string.' })
    categoria_nome: string;

    /**
     * ID da categoria.
     * Exemplo: 1
     */
    @IsNumber({}, { message: 'O ID da categoria deve ser um número.' })
    categoria_id: number;

    /**
     * Valor do crédito.
     * Exemplo: 100.50
     */
    @IsNumber({}, { message: 'O valor deve ser um número.' })
    valor: number;

    /**
     * Data de vencimento do crédito.
     * Exemplo: "2023-12-31"
     */
    @IsDateString({}, { message: 'A data de vencimento deve ser uma string de data válida.' })
    data_vencimento: string;

    /**
     * Data de competência do crédito.
     * Exemplo: "2023-12-01"
     */
    @IsDateString({}, { message: 'A data de competência deve ser uma string de data válida.' })
    data_competencia: string;

    /**
     * Data de pagamento do crédito.
     * Exemplo: "2023-12-15"
     */
    @IsOptional()
    @IsDateString({}, { message: 'A data de pagamento deve ser uma string de data válida.' })
    data_pagamento: string | null;

    /**
     * Conta associada ao crédito.
     * Exemplo: "Conta Exemplo"
     */
    @IsString({ message: 'A conta deve ser uma string.' })
    conta: string;

    /**
     * Criado por.
     * Exemplo: "andre@example.com"
     */
    @IsString({ message: 'O campo criado por deve ser uma string.' })
    atualizado_por: string;
}