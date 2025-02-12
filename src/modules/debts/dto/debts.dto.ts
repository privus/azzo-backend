import { IsString, IsOptional, IsNumber, IsInt, IsDateString, Length, Min } from 'class-validator';

export class DebtsDto {
  /**
   * Nome da despesa
   * exemplo: 'Conta de luz'
   */
  @IsString({ message: 'O nome da despesa deve ser uma string.' })
  @Length(3, 90, { message: 'O nome da despesa deve ter entre 3 e 90 caracteres.' })
  nome: string;
  /**
   * Número de parcelas.
   * Exemplo: 3
   */
  @IsOptional()
  @IsInt({ message: 'O número de parcelas deve ser um inteiro.' })
  @Min(1, { message: 'O número de parcelas deve ser no mínimo 1.' })
  numero_parcelas?: number;

  /**
   * Data de competencia do débito (formato ISO ou YYYY-MM-DD).
   * Exemplo: '2025-01-08'
   */
  @IsString({ message: 'A data de competencia deve ser uma string.' })
  @Length(3, 90, { message: 'O banco deve ter entre 3 e 180 caracteres.' })
  data_competencia: string;

  /**
   * Data de criação de pagamento do débito (formato ISO ou YYYY-MM-DD).
   * Exemplo: '2025-01-08'
   */
  @IsOptional()
  @IsDateString({}, { message: 'A data de pagamento deve estar em formato de data válido (YYYY-MM-DD).' })
  data_pagamento?: string;

  /**
   * Descrição do débito.
   * Exemplo: 'Conta de luz'
   */
  @IsString({ message: 'A descrição deve ser uma string.' })
  @Length(3, 90, { message: 'A descrição deve ter entre 3 e 90 caracteres.' })
  descricao: string;

  /**
   * Valor total do débito.
   * Exemplo: 360.00
   */
  @IsNumber({}, { message: 'O valor total deve ser numérico.' })
  @Min(0, { message: 'O valor total não pode ser negativo.' })
  valor_total: number;

  /**
   * Banco.
   * Exemplo: Santander, Itaú, Bradesco
   */
  @IsString({ message: 'O banco deve ser uma string.' })
  @Length(3, 90, { message: 'O banco deve ter entre 3 e 90 caracteres.' })
  conta: string;

  /**
   * Data de vencimento.
   * Exemplo: '2025-01-16'
   */
  @IsString({ message: 'A data de vencimento deve ser uma string.' })
  @Length(3, 90, { message: 'O banco deve ter entre 3 e 180 caracteres.' })
  data_vencimento: string;

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
   * Exemplo: '1', '2', '3'
   */
  @IsOptional()
  @IsNumber({}, { message: 'A categoria ID deve ser um número.' })
  categoria_id?: number;

  /**
   * Departamento ID do débito.
   * Exemplo: '1', '2', '3'
   */
  @IsOptional()
  @IsNumber({}, { message: 'A departamento ID deve ser um número.' })
  departamento_id?: number;

  /**
   * Nome do departamento.
   * Exemplo: 'Financeiro'
   */
  @IsOptional()
  @IsString({ message: 'O nome do departamento deve ser uma string.' })
  @Length(3, 90, {
    message: 'O nome do departamento deve ter entre 3 e 90 caracteres.',
    each: false,
  })
  departamento_nome?: string;

  /**
   * Nome doa categoria.
   * Exemplo: 'Financeiro'
   */
  @IsOptional()
  @IsString({ message: 'O nome da categoria deve ser uma string.' })
  @Length(3, 90, {
    message: 'O nome da categoria deve ter entre 3 e 90 caracteres.',
    each: false,
  })
  categoria_nome?: string;

  /**
   * Peridisidade do débito.
   * Exemplo: 30
   */
  @IsOptional()
  @IsInt({ message: 'A periodicidade deve ser um inteiro.' })
  periodicidade?: number;

  /**
   * Empresa Grupo.
   * Exemplo: 'Azzo Distribuidora'
   */
  @IsString({ message: 'O nome do grupo deve ser uma string.' })
  @Length(3, 90, { message: 'O nome do grupo deve ter entre 3 e 90 caracteres.' })
  empresa_grupo: string;

  /**
   * Despesa Grupo.
   * Exemplo: 1
   */
  @IsOptional()
  @IsInt({ message: 'O despesa grupo deve ser um inteiro.' })
  despesa_grupo?: number;

  @IsString({ message: 'O userEmail deve ser uma string.' })
  @Length(3, 90, { message: 'O banco deve ter entre 3 e 90 caracteres.' })
  criado_por: string;
}
