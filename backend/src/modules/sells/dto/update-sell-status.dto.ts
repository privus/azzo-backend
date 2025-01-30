import { IsNumber } from 'class-validator';

export class UpdateSellStatusDto {
  /**
   * ID da venda.
   * Exemplo: 123
   */
  @IsNumber({}, { message: 'O ID da venda deve ser um número.' })
  venda_id: number;

  /**
   * ID do status da venda.
   * Exemplo: 1
   */
  @IsNumber({}, { message: 'O ID do status da venda deve ser um número.' })
  status_venda_id: number;
}
