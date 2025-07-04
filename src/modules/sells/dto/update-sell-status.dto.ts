import { IsNumber, IsOptional } from 'class-validator';

export class UpdateSellStatusDto {
  /**
   * ID da venda.
   * Exemplo: 123
   */
  @IsNumber({}, { message: 'O ID da venda deve ser um número.' })
  codigo: number;

  /**
   * ID do status da venda.
   * Exemplo: 1
   */
  @IsNumber({}, { message: 'O ID do status da venda deve ser um número.' })
  status_venda_id: number;

  /**
   * Numero notafiscal.
   * Exemplo: 56789
   */
  @IsNumber({}, { message: 'O número da nota fiscal deve ser um número.' })
  numero_nfe: number;

  /**
   * Valor Frete.
   * Exemplo: 37.50
   */
  @IsOptional()
  @IsNumber({}, { message: 'O valor do frete deve ser um número.' })
  valor_frete?: number;
}
