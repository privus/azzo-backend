import { IsString, IsOptional, IsNumber, IsInt, IsDateString, Length, Min } from 'class-validator';

export class UpdateProductDto {
  /**
	 * Tiny ID do produto
	 * Exemplo: '123456789'
	 */
	@IsOptional()
	@IsNumber({}, { message: 'O Tiny ID deve ser um número.' })
	@Length(9, 9, { message: 'O Tiny ID SP deve ter exatamente 9 caracteres.' })
	tiny_mg?: number;

	  /**
	 * Tiny ID SP do produto
	 * Exemplo: '123456789'
	 */
	@IsOptional()
	@IsNumber({}, { message: 'O Tiny ID SP deve ser um número.' })
	@Length(9, 9, { message: 'O Tiny ID SP deve ter exatamente 9 caracteres.' })
	tiny_sp?: number;

  /**
   * Altura do produto em centímetros.
   * Exemplo: 25
   */
  @IsOptional()
  @IsNumber({}, { message: 'A altura deve ser um número.' })
  altura?: number;

  /**
   * Largura do produto em centímetros.
   * Exemplo: 15
   */
  @IsOptional()
  @IsNumber({}, { message: 'A largura deve ser um número.' })
  largura?: number;

  /**
   * Comprimento do produto em centímetros.
   * Exemplo: 30
   */
  @IsOptional()
  @IsNumber({}, { message: 'O comprimento deve ser um número.' })
  comprimento?: number;

  /**
   * Peso do produto em gramas.
   * Exemplo: 500
   */
  @IsOptional()
  @IsNumber({}, { message: 'O peso deve ser um número.' })
  peso_grs?: number;
}
