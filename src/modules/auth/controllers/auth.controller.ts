import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginUserDto } from '../dto/login-user.dto';
import { RegisterUserDto } from '../dto/register-user.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BlingTokenService } from '../services/bling-token.service';
import { BlingAuthService } from '../services/bling-auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly blingAuthService: BlingAuthService,
  ) {}

  @ApiOperation({ summary: 'Login de usuário' })
  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    const token = await this.authService.login(loginUserDto);
    return token;
  }

  @ApiOperation({ summary: 'Registro de usuário' })
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    const user = await this.authService.register(registerUserDto);
    return { message: 'Usuário registrado com sucesso.', user };
  }

  @ApiOperation({ summary: 'Obter token de acesso para Bling' })
  @Get('blingToken/:company')
  async getBlingToken(@Param('company') company: string) {
    const token = await this.blingAuthService.getAccessToken(company);
    return token;
  }
}
