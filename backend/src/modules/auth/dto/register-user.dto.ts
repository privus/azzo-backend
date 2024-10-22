import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsNumber } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  senha: string;

  @IsNotEmpty()
  endereco: string;
  data_nascimento?: string;
  username: string;

  @IsNumber()
  cidade_id: number;
  cargo_id: number;
  celular: string;

  @IsOptional()
  regiao_id?: number;
  usuario_id?: number;
}
