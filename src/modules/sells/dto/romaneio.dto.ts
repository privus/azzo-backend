import { IsString, IsOptional, IsNumber, IsArray, ArrayNotEmpty, Length } from 'class-validator';

export class RomaneioDto {
  /**
   * Códigos das vendas
   * Exemplo: [12345, 12346, 12347]
   */
  @IsArray({ message: 'O campo códigos deve ser um array de números.' })
  @ArrayNotEmpty({ message: 'Informe ao menos um código de venda.' })
  @IsNumber({}, { each: true, message: 'Todos os códigos devem ser números.' })
  codigos: number[];

  /**
   * ID da transportadora
   * Exemplo: 1
   */
  @IsOptional()
  @IsNumber({}, { message: 'O ID da transportadora deve ser um número.' })
  transportadora_id?: number;

  /**
   * Nome da transportadora
   * Exemplo: 'Transportadora XYZ'
   */
  @IsOptional()
  @IsString({ message: 'O nome da transportadora deve ser uma string.' })
  @Length(3, 90, { message: 'O nome da transportadora deve ter entre 3 e 45 caracteres.' })
  transportadora_nome?: string;

  /**
   * Data de criação do romaneio
   * Exemplo: '2023-10-01'
   */
  @IsString({ message: 'A data de criação deve ser uma string.' })
  @Length(3, 90, { message: 'O data criação deve ter entre 3 e 180 caracteres.' })
  data_criacao: string;

  /**
   * Código de rastreio
   * Exemplo: 'ABC123456'
   */
  @IsOptional()
  @IsString({ message: 'O código de rastreio deve ser uma string.' })
  @Length(3, 90, { message: 'O código de rastreio deve ter entre 3 e 90 caracteres.' })
  cod_rastreio?: string;
}
