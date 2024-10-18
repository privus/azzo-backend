// src/application/use-cases/login-user.use-case.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { LoginUserDto } from '../dto/login-user.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(loginDto: LoginUserDto): Promise<{ accessToken: string }> {
    const { email, senha } = loginDto;

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha inválida.');
    }

    const payload = {
      userId: user.usuario_id,
      email: user.email,
      cargo: user.cargo_id,
    };
    const secret = this.configService.get<string>('JWT_SECRET') || 'defaultSecret';
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '1h';

    const accessToken = jwt.sign(payload, secret, { expiresIn });

    return { accessToken };
  }
}
