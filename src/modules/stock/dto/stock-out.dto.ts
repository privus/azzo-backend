import { IsArray, IsNumber, IsOptional, IsString, Length, ValidateNested } from 'class-validator';
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
   * Tipo de saída do produto.
   * Exemplo: "Venda"
   */
  @IsString({ message: 'O tipo deve ser um texto.' })
  tipo_saida: string;

    /**
   * Observação da saida
   * Exemplo: "Para uso na cozinha"
   */
  @IsString({ message: 'A observação deve ser um texto.' })
  observacao: string;

    /**
   * ID do Colaborador
   * Exemplo: 1
   */
  @IsOptional()
  @IsNumber({}, { message: 'O ID da transportadora deve ser um número.' })
  colaborador_id?: number;
  
    /**
   * Nome do Colaborador
   * Exemplo: 'João Mathias'
   */
  @IsOptional()
  @IsString({ message: 'O nome do colaborador deve ser uma string.' })
  @Length(3, 90, { message: 'O nome do colaborador deve ter entre 3 e 90 caracteres.' })
  colaborador_nome?: string;

  /**
   * Lista de produtos para saída.
   */
  @IsArray({ message: 'Produtos deve ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => ProductOutDto)
  produtos: ProductOutDto[];
}