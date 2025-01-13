import { IsString, IsOptional, IsNumber, IsInt, IsDateString, Length, Min } from 'class-validator';

export class DebtsDto {
  /**
   * Número de parcelas.
   * Exemplo: 3
   */
  @IsOptional()
  @IsInt({ message: 'O número de parcelas deve ser um inteiro.' })
  @Min(1, { message: 'O número de parcelas deve ser no mínimo 1.' })
  numero_parcelas?: number;

  /**
   * Data de criação do débito (formato ISO ou YYYY-MM-DD).
   * Exemplo: '2025-01-08'
   */
  @IsDateString({}, { message: 'A data de criação deve estar em formato de data válido (YYYY-MM-DD).' })
  data_criacao: Date;

  /**
   * Data de criação de pagamento do débito (formato ISO ou YYYY-MM-DD).
   * Exemplo: '2025-01-08'
   */
  @IsOptional()
  @IsDateString({}, { message: 'A data de pagamento deve estar em formato de data válido (YYYY-MM-DD).' })
  data_pagamento?: Date;

  /**
   * Descrição do débito.
   * Exemplo: 'Conta de luz'
   */
  @IsString({ message: 'A descrição deve ser uma string.' })
  @Length(3, 90, { message: 'A descrição deve ter entre 3 e 90 caracteres.' })
  descricao: string;

  /**
   * Valor da parcela.
   * Exemplo: 120.50
   */
  @IsOptional()
  @IsNumber({}, { message: 'O valor da parcela deve ser numérico.' })
  @Min(0, { message: 'O valor da parcela não pode ser negativo.' })
  valor_parcela?: number;

  /**
   * Valor total do débito.
   * Exemplo: 360.00
   */
  @IsNumber({}, { message: 'O valor total deve ser numérico.' })
  @Min(0, { message: 'O valor total não pode ser negativo.' })
  valor_total: number;

  /**
   * Método de pagamento.
   * Exemplo: 'Boleto', 'Dinheiro', 'Cartão'
   */
  @IsString({ message: 'O método de pagamento deve ser uma string.' })
  @Length(3, 180, { message: 'O método de pagamento deve ter entre 3 e 180 caracteres.' })
  metodo_pagamento: string;

  /**
   * Datas de vencimento (caso seja apenas uma, repita a mesma).
   * Exemplo: '2025-01-16, 2025-01-23, 2025-01-30'
   */
  @IsOptional()
  @IsString({ each: true, message: 'Cada data de vencimento deve ser uma string.' })
  @Length(10, 10, { each: true, message: 'Cada data de vencimento deve ter exatamente 10 caracteres (formato YYYY-MM-DD).' })
  datas_vencimento: string[];

  /**
   * Juros do débito.
   * Exemplo: 15.50
   */
  @IsOptional()
  @IsNumber({}, { message: 'O juros deve ser numérico.' })
  @Min(0, { message: 'O juros não pode ser negativo.' })
  juros?: number;

  /**
   * Categoria ID do débito.
   * Exemplo: 'Energia', 'Água', 'Telefone'
   */
  @IsNumber({}, { message: 'A categoria ID deve ser um número.' })
  categoria_id: number;
}
