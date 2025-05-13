import { IsString, IsOptional, IsNumber, IsInt, IsArray, ArrayNotEmpty, ArrayMinSize, IsPositive, IsDefined, Length } from 'class-validator';

export class RomaneioDto {
  /**
   * Códigos das vendas
   * Exemplo: [12345, 12346, 12347]
   */
  @IsArray({ message: 'O campo code deve ser um array de números.' })
  @ArrayNotEmpty({ message: 'Informe ao menos um código de venda.' })
  @IsNumber({}, { each: true, message: 'Todos os códigos devem ser números.' })
  codes: number[];

  /**
   * ID da transportadora
   * Exemplo: 1
   */
  @IsOptional()
  @IsNumber({}, { message: 'O ID da transportadora deve ser um número.' })
  @IsPositive({ message: 'O ID da transportadora deve ser positivo.' })
  transportadora_id?: number;

  /**
   * Nome da transportadora
   * Exemplo: 'Transportadora XYZ'
   */
  @IsOptional()
  @IsString({ message: 'O nome da transportadora deve ser uma string.' })
  @Length(3, 90, { message: 'O nome da transportadora deve ter entre 3 e 45 caracteres.' })
  transportadora_nome?: string;
}
