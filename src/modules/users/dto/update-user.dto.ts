import { IsEmail, MinLength, IsOptional, IsNumber, IsString, Length, Matches } from 'class-validator';

export class UpdateUserDto {
  /**
   * Nome completo do usuário.
   * Exemplo: 'André Juan'
   */
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string.' })
  @Length(3, 90, { message: 'O nome deve ter entre 3 e 90 caracteres.' })
  nome?: string;

  /**
   * Endereço de e-mail do usuário.
   * Deve ser um e-mail válido.
   * Exemplo: 'andre@email.com'
   */
  @IsOptional()
  @IsEmail({}, { message: 'Forneça um e-mail válido.' })
  email?: string;

  /**
   * Senha do usuário.
   * Exemplo: 'senha123'
   */
  @IsOptional()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  senha?: string;

  /**
   * Endereço do usuário.
   * Exemplo: 'Rua Exemplo, 123'
   */
  @IsOptional()
  @IsString({ message: 'O endereço deve ser uma string.' })
  @Length(5, 90, { message: 'O endereço deve ter entre 5 e 90 caracteres.' })
  endereco?: string;

  /**
   * Data de nascimento do usuário no formato DD/MM/YYYY.
   * Deve seguir o formato '15/05/1993'.
   */
  @IsOptional()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, { message: 'A data de nascimento deve estar no formato DD/MM/YYYY.' })
  nascimento?: string;

  /**
   * ID da cidade do usuário.
   */
  @IsOptional()
  @IsNumber({}, { message: 'O ID da cidade deve ser um número.' })
  cidade_id?: number;

  /**
   * ID do cargo do usuário.
   */
  @IsOptional()
  @IsNumber({}, { message: 'O ID do cargo deve ser um número.' })
  cargo_id?: number;

  /**
   * Deve conter exatamente 11 dígitos (incluindo o DDD).
   * Exemplo: '(35) 91990909'
   */
  @IsOptional()
  @IsString({ message: 'O celular deve ser uma string.' })
  @Matches(/^.{15}$/, { message: 'O celular deve conter exatamente 15 caracteres.' })
  celular?: string;

  /**
   * ID da região do usuário.
   * Deve ser um número.
   * Exemplo: 3
   */
  @IsOptional()
  @IsNumber({}, { message: 'O ID da região deve ser um número.' })
  regiao_id?: number;
}
