// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cargo, Usuario, Regiao, Cidade } from '../..//infrastructure/database/entities';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { UserModule } from '../../domain/userModule/repositories/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Cargo, Regiao, Cidade]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'defaultSecret',
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '5h' },
      }),
    }),
    UserModule, // Importa o UserModule que fornece IUserRepository
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService],
  exports: [JwtModule, AuthModule, UserModule],
})
export class AuthModule {}
