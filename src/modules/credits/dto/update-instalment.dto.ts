import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateInstalmentDto {
  /**
   * ID da parcela.
   * Exemplo: 123
   */
  @IsNumber({}, { message: 'O ID da parcela deve ser um número.' })
  parcela_id: number;

  /**
   * ID do status pagamento.
   * Exemplo: 1
   */
  @IsNumber({}, { message: 'O ID do status pagamento deve ser um número.' })
  status_pagamento_id: number;

  /**
   * Data de pagamento.
   * Exemplo: 2021-09-01
   */
  @IsOptional()
  @IsString({ message: 'A data de pagamento deve ser uma data válida.' })
  data_pagamento: string;

  /**
   * Juros do pagamento em atraso.
   * Exemplo: 10.50
   */
  @IsOptional()
  @IsNumber({}, { message: 'O valor total deve ser um número.' })
  valor_total: number;

  /**
   * Usuário que atualizou a parcela.
   * Exemplo: 'fulano.silva'
   */
  @IsString({ message: 'O usuário que atualizou a parcela deve ser uma string.' })
  atualizado_por: string;

  @IsOptional()
  @IsString({ message: 'A data de vencimento deve ser uma data válida.' })
  data_vencimento: string;
}
