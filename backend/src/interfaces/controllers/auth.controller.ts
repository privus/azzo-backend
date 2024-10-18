import { Controller, Post, Body } from '@nestjs/common';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { RegisterUserDto } from '../../application/dto/register-user.dto';
import { LoginUserDto } from '../../application/dto/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    const user = await this.registerUserUseCase.execute(registerUserDto);
    return { message: 'Usuário registrado com sucesso.', user };
  }

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    const token = await this.loginUserUseCase.execute(loginUserDto);
    return { message: 'Login bem-sucedido.', token };
  }
}
