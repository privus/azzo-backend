import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { RegisterUserDto } from '../dto/register-user.dto';
import { User } from '../../domain/entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class RegisterUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(registerDto: RegisterUserDto): Promise<User> {
    const { email, senha, ...rest } = registerDto;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('Email já está em uso.');
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const user: User = {
      ...rest,
      email,
      senha: hashedPassword,
      usuario_id: 0, // Será gerado pelo banco
    };

    return await this.userRepository.create(user);
  }
}
