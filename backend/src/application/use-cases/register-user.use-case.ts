import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { RegisterUserDto } from '../dto/register-user.dto';
import { User } from '../../domain/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from 'src/infrastructure/database/repositories/user.repository';
import { Usuario } from 'src/infrastructure/database/entities';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @InjectRepository(UserRepository) private userRepository: IUserRepository,
  ) {}

  async execute(registerDto: RegisterUserDto): Promise<Usuario> {
    const { email, senha, ...rest } = registerDto;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('Email já está em uso.');
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const user = new Usuario({
      ...rest,
      email,
      senha: hashedPassword,
    });

    return await this.userRepository.create(user);
  }
}
