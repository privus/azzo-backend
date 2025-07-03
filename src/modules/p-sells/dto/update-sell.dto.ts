import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSellDto {
  /**
   * ID da venda.
   * Exemplo: 123
   */
  @IsNumber({}, { message: 'O ID da venda deve ser um número.' })
  codigo: number;

  /**
   * ID do status de pagamento.
   * Exemplo: 2
   */
  @IsOptional()
  @IsNumber({}, { message: 'O ID do status de pagamento deve ser um número.' })
  status_pagamento_id?: number;

  /**
   * Número da nota fiscal.
   * Exemplo: 56789
   */
  @IsOptional()
  @IsNumber({}, { message: 'O número da nota fiscal deve ser um número.' })
  numero_nfe?: number;

  /**
   * ID da forma de pagamento.
   * Exemplo: 1
   */
  @IsOptional()
  @IsNumber({}, { message: 'O ID da forma de pagamento deve ser um número.' })
  forma_pagamento_id?: number;

  /**
   * Nome da forma de pagamento.
   * Exemplo: 'Cartão de Crédito'
   */
  @IsOptional()
  @IsString({ message: 'O nome da forma de pagamento deve ser uma string.' })
  forma_pagamento_nome?: string;
}