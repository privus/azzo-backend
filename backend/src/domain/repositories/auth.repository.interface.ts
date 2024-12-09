import { Usuario } from '../../infrastructure/database/entities';
import { LoginUserDto } from '../../modules/auth/dto/login-user.dto';
import { RegisterUserDto } from '../../modules/auth/dto/register-user.dto';

export interface IAuthRepository {
  login(loginDto: LoginUserDto): Promise<{ accessToken: string }>;
  register(registerDto: RegisterUserDto): Promise<Partial<Usuario>>;
}
