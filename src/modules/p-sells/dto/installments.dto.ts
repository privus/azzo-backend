import { IsString, IsOptional, IsNumber } from 'class-validator';

export class InstallmentsDto {
  /**
   * Valor da parcela.
   * Exemplo: 150.75
   */
  @IsNumber({}, { message: 'O valor da parcela deve ser um número.' })
  valor: number;

  /**
   * Número da parcela.
   * Exemplo: 1
   */
  @IsNumber({}, { message: 'O número da parcela deve ser um número.' })
  numero: number;

  /**
   * Data de vencimento da parcela.
   * Exemplo: '2024-07-10'
   */
  @IsString({ message: 'A data de vencimento deve ser uma string.' })
  data_vencimento: string;

  /**
   * Data de competência da parcela.
   * Exemplo: '2024-07-01'
   */
  @IsString({ message: 'A data de competência deve ser uma string.' })
  data_competencia: string;

  /**
   * Data de pagamento da parcela.
   * Exemplo: '2024-07-11' ou null
   */
  @IsOptional()
  @IsString({ message: 'A data de pagamento deve ser uma string ou null.' })
  data_pagamento: string | null;
}
