// src/infrastructure/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../database/entities';
import { User } from '../../../domain/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Usuario)
    private userRepository: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Token expira
      secretOrKey: configService.get<string>('JWT_SECRET') || 'defaultSecret',
    });
  }

  async validate(payload: any): Promise<User> {
    const userEntity = await this.userRepository.findOne({ where: { usuario_id: payload.userId } });
    if (!userEntity) {
      throw new UnauthorizedException();
    }

    const user: User = {
      usuario_id: userEntity.usuario_id,
      nome: userEntity.nome,
      email: userEntity.email,
      senha: userEntity.senha,
      celular: userEntity.celular,
      endereco: userEntity.endereco,
      data_nascimento: userEntity.data_nascimento,
      username: userEntity.username,
      cidade_id: userEntity.cidade.cidade_id,
      cargo_id: userEntity.cargo.cargo_id,
      regiao_id: userEntity.regiao.regiao_id,
    };

    return user;
  }
}
