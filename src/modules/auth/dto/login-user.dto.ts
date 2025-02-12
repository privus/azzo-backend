import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginUserDto {
  /**
   * Endereço de e-mail do usuário.
   * Deve ser um e-mail válido.
   * Exemplo: 'andre@gmail.com'
   */
  @IsEmail()
  email: string;

  /**
   * Senha do usuário.
   * Deve ter no mínimo 6 caracteres.
   * Exemplo: 'senha123'
   */
  @IsNotEmpty()
  senha: string;
}
