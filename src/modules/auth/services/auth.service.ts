import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { LoginUserDto } from '../dto/login-user.dto';
import { RegisterUserDto } from '../dto/register-user.dto';
import { IUserRepository, IAuthRepository, ISharedRepository } from '../../../domain/repositories';
import { Usuario } from '../../../infrastructure/database/entities';

@Injectable()
export class AuthService implements IAuthRepository {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    @Inject('ISharedRepository') private readonly sharedRepository: ISharedRepository,
  ) {}

  async login(loginDto: LoginUserDto): Promise<{ accessToken: string }> {
    const { email, senha } = loginDto;

    const user = await this.userRepository.findBy({ email });
    if (!user) {
      throw new UnauthorizedException('Email não encontrado.');
    }

    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha inválida.');
    }

    const payload = {
      userId: user.usuario_id,
      email: user.email,
      cargo: user.cargo,
      nome: user.nome,
      companyId: user.company.company_id,
    };

    // Certifique-se de que o `JWT_SECRET` está carregado corretamente do ambiente
    const secret = process.env.JWT_SECRET as string;

    if (!secret) {
      throw new Error('JWT_SECRET não está definido nas variáveis de ambiente');
    }

    // Converta `expiresIn` para um valor válido (string ou número)
    const expiresIn: string | number = process.env.JWT_EXPIRATION || '1h';


    const accessToken = jwt.sign(payload, secret, { 
      expiresIn: '1h' 
    });

    return { accessToken };
  }

  async register(registerDto: RegisterUserDto): Promise<Partial<Usuario>> {
    const { email, senha, cargo_id, regiao_id, cidade_id, username, ...rest } = registerDto;

    // Obtem entidades relacionadas
    const { cargo, cidade, regiao } = await this.sharedRepository.getRelatedEntities(cargo_id, cidade_id, regiao_id);

    // Verifica se o email já está em uso
    const existingUserByEmail = await this.userRepository.findBy({ email });
    if (existingUserByEmail) {
      throw new UnauthorizedException('Email já está em uso.');
    }

    // Verifica se o username já está em uso
    const existingUserByUsername = await this.userRepository.findBy({ username });
    if (existingUserByUsername) {
      throw new UnauthorizedException('Username já está em uso.');
    }

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Registra o usuário
    return await this.userRepository.register({
      ...rest,
      email,
      username, // Adiciona o username ao registro
      senha: hashedPassword,
      cargo,
      cidade,
      regiao,
    });
  }
}
