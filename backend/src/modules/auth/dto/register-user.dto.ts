import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsNumber, IsString, Length, Matches } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @IsString({ message: 'O nome deve ser uma string.' })
  @Length(3, 90, { message: 'O nome deve ter entre 3 e 90 caracteres.' })
  nome: string;

  @IsEmail({}, { message: 'Forneça um e-mail válido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email: string;

  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  senha: string;

  @IsNotEmpty({ message: 'O endereço é obrigatório.' })
  @IsString({ message: 'O endereço deve ser uma string.' })
  @Length(5, 90, { message: 'O endereço deve ter entre 5 e 90 caracteres.' })
  endereco: string;

  @IsNotEmpty({ message: 'A data de nascimento é obrigatória.' })
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, { message: 'A data de nascimento deve estar no formato DD/MM/YYYY.' })
  data_nascimento: string;

  @IsNotEmpty({ message: 'O nome de usuário é obrigatório.' })
  @IsString({ message: 'O nome de usuário deve ser uma string.' })
  @Length(3, 45, { message: 'O nome de usuário deve ter entre 3 e 45 caracteres.' })
  username: string;

  @IsNotEmpty({ message: 'O ID da cidade é obrigatório.' })
  @IsNumber({}, { message: 'O ID da cidade deve ser um número.' })
  cidade_id: number;

  @IsNotEmpty({ message: 'O ID do cargo é obrigatório.' })
  @IsNumber({}, { message: 'O ID do cargo deve ser um número.' })
  cargo_id: number;

  @IsNotEmpty({ message: 'O celular é obrigatório.' })
  @IsString({ message: 'O celular deve ser uma string.' })
  @Matches(/^\d{11}$/, { message: 'O celular deve conter exatamente 10 dígitos numéricos.' })
  celular: string;

  @IsOptional()
  @IsNumber({}, { message: 'O ID da região deve ser um número.' })
  regiao_id?: number;

  @IsOptional()
  @IsNumber({}, { message: 'O ID do usuário deve ser um número.' })
  usuario_id?: number;
}
