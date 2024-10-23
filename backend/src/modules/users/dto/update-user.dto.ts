import { IsEmail, MinLength, IsOptional, IsNumber, IsString, Length, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string.' })
  @Length(3, 90, { message: 'O nome deve ter entre 3 e 90 caracteres.' })
  nome?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Forneça um e-mail válido.' })
  email?: string;

  @IsOptional()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  senha?: string;

  @IsOptional()
  @IsString({ message: 'O endereço deve ser uma string.' })
  @Length(5, 90, { message: 'O endereço deve ter entre 5 e 90 caracteres.' })
  endereco?: string;

  @IsOptional()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, { message: 'A data de nascimento deve estar no formato DD/MM/YYYY.' })
  data_nascimento?: string;

  @IsOptional()
  @IsNumber({}, { message: 'O ID da cidade deve ser um número.' })
  cidade_id?: number;

  @IsOptional()
  @IsNumber({}, { message: 'O ID do cargo deve ser um número.' })
  cargo_id?: number;

  @IsOptional()
  @IsString({ message: 'O celular deve ser uma string.' })
  @Matches(/^\d{11}$/, { message: 'O celular deve conter exatamente 11 dígitos numéricos.' })
  celular?: string;

  @IsOptional()
  @IsNumber({}, { message: 'O ID da região deve ser um número.' })
  regiao_id?: number;

  @IsOptional()
  @IsNumber({}, { message: 'O ID do usuário deve ser um número.' })
  usuario_id?: number;
}
