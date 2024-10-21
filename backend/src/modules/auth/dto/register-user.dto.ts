import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsNumber } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  senha: string;

  @IsOptional()
  celular?: string;

  @IsNotEmpty()
  endereco: string;

  @IsNotEmpty()
  data_nascimento?: string;

  @IsNotEmpty()
  username: string;

  @IsNumber()
  cidade_id: number;

  @IsNumber()
  cargo_id: number;

  @IsOptional()
  regiao_id?: number;
}
