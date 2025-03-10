import { IsNumber } from 'class-validator';

export class UpdateDebtStatusDto {
  /**
   * ID do debito.
   * Exemplo: 123
   */
  @IsNumber({}, { message: 'O ID do debito deve ser um número.' })
  debito_id: number;

  /**
   * ID do status do debito.
   * Exemplo: 1
   */
  @IsNumber({}, { message: 'O ID do status do debito deve ser um número.' })
  status_pagamento_id: number;
}
