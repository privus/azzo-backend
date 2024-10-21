// src/modules/auth/controllers/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginUserDto } from '../dto/login-user.dto';
import { RegisterUserDto } from '../dto/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    const token = await this.authService.login(loginUserDto);
    return { message: 'Login bem-sucedido.', token };
  }

  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    const user = await this.authService.register(registerUserDto);
    return { message: 'Usuário registrado com sucesso.', user };
  }
}
