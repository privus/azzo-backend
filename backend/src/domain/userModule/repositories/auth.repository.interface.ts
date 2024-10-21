import { Usuario } from 'src/infrastructure/database/entities';
import { LoginUserDto } from 'src/modules/auth/dto/login-user.dto';
import { RegisterUserDto } from 'src/modules/auth/dto/register-user.dto';

export interface IAuthRepository {
  login(loginDto: LoginUserDto): Promise<{ accessToken: string }>;
  register(registerDto: RegisterUserDto): Promise<Usuario>,
}
