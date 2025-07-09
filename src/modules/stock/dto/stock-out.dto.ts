import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductOutDto {
  /**
   * ID do produto.
   * Exemplo: 123
   */
  @IsNumber({}, { message: 'O ID do produto deve ser um número.' })
  produto_id: number;

  /**
   * Quantidade de saída do produto.
   * Exemplo: 10
   */
  @IsNumber({}, { message: 'A quantidade de saída deve ser um número.' })
  quantidade: number;
}

export class StockOutDto {
  /**
   * Motivo da saída do produto.
   * Exemplo: "Venda"
   */
  @IsString({ message: 'A observação deve ser um texto.' })
  observacao: string;

  /**
   * Lista de produtos para saída.
   */
  @IsArray({ message: 'Produtos deve ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => ProductOutDto)
  produtos: ProductOutDto[];
}