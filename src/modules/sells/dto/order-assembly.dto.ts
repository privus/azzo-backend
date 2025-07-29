import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsIn,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para um item bipado na montagem.
 */
export class AssemblyItemDto {
  /**
   * ID do item de venda
   * Exemplo: 10023
   */
  @IsNumber({}, { message: 'O ID do item de venda deve ser um número.' })
  itensVendaId: number;

  /**
   * Quantidade bipada
   * Exemplo: 2
   */
  @IsNumber({}, { message: 'A quantidade bipada deve ser um número.' })
  @Min(0, { message: 'A quantidade bipada não pode ser negativa.' })
  scannedCount: number;
}

/**
 * DTO principal para atualizar o status e progresso da montagem.
 */
export class AssemblyStatusDto {
  /**
   * ID da montagem (opcional ao iniciar)
   * Exemplo: 33
   */
  @IsOptional()
  @IsNumber({}, { message: 'O ID da montagem deve ser um número.' })
  montagemId?: number;

  /**
   * E-mail do responsável
   * Exemplo: 'usuario@empresa.com'
   */
  @IsString({ message: 'O e-mail do responsável deve ser uma string.' })
  @MaxLength(120, { message: 'O e-mail deve ter no máximo 120 caracteres.' })
  responsavel: string;

  /**
   * Status da montagem ('iniciada', 'pausada' ou 'finalizada')
   * Exemplo: 'iniciada'
   */
  @IsString({ message: 'O status deve ser uma string.' })
  @IsIn(['iniciada', 'pausada', 'finalizada'], {
    message: 'Status inválido. Use "iniciada", "pausada" ou "finalizada".',
  })
  status: 'iniciada' | 'pausada' | 'finalizada';

  /**
   * Motivo da pausa (apenas quando status for "pausada")
   * Exemplo: 'Problema no scanner'
   */
  @IsOptional()
  @IsString({ message: 'O motivo da pausa deve ser uma string.' })
  @MaxLength(180, { message: 'O motivo da pausa deve ter no máximo 180 caracteres.' })
  motivoPausa?: string;

  /**
   * Lista de itens bipados até o momento
   * Exemplo: [{ itensVendaId: 10023, scannedCount: 2 }]
   */
  @IsArray({ message: 'O campo itens deve ser um array.' })
  @ArrayNotEmpty({ message: 'Informe ao menos um item bipado.' })
  @ValidateNested({ each: true })
  @Type(() => AssemblyItemDto)
  itens: AssemblyItemDto[];
}
