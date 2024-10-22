import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { LoginUserDto } from '../dto/login-user.dto';
import { RegisterUserDto } from '../dto/register-user.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { Usuario, Cargo, Cidade, Regiao } from '../../../infrastructure/database/entities';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IAuthRepository } from '../../../domain/repositories/auth.repository.interface';

@Injectable()
export class AuthService implements IAuthRepository {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    private readonly configService: ConfigService,
    @InjectRepository(Cargo) private readonly cargoRepository: Repository<Cargo>,
    @InjectRepository(Cidade) private readonly cidadeRepository: Repository<Cidade>,
    @InjectRepository(Regiao) private readonly regiaoRepository: Repository<Regiao>,
  ) {}

  async getRelatedEntities(cargo_id: number, cidade_id: number, regiao_id: number) {
    console.log('regiao_idv ==>', regiao_id);
    const cargo = await this.cargoRepository.findOne({ where: { cargo_id } });
    const cidade = await this.cidadeRepository.findOne({ where: { cidade_id } });
    const regiao = await this.regiaoRepository.findOne({ where: { regiao_id } });

    return { cargo, cidade, regiao };
  }

  async login(loginDto: LoginUserDto): Promise<{ accessToken: string }> {
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
      cargo: user.cargo,
    };
    const secret = this.configService.get<string>('JWT_SECRET') || 'your_jwt_secret';
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '5h';

    const accessToken = jwt.sign(payload, secret, { expiresIn });

    return { accessToken };
  }

  async register(registerDto: RegisterUserDto): Promise<Partial<Usuario>> {
    const { email, senha, cargo_id, regiao_id, cidade_id, ...rest } = registerDto;

    console.log('regiao_idv ==>', regiao_id);

    const { cargo, cidade, regiao } = await this.getRelatedEntities(cargo_id, cidade_id, regiao_id); //parametros na ordem correta

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('Email já está em uso.');
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    return await this.userRepository.register({
      ...rest,
      email,
      senha: hashedPassword,
      cargo,
      cidade,
      regiao,
    });
  }
}
