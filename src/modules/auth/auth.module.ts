import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlingTokens, Usuario } from '../../infrastructure/database/entities';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { UsersModule } from '../users/users.module';
import { SharedModule } from '../shared/shared.module';
import { BlingTokenService } from '../auth/services/bling-token.service'; // ajuste o caminho conforme necessário
import { BlingAuthService } from './services/bling-auth.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, BlingTokens]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your_jwt_secret',
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '5h' },
      }),
    }),
    UsersModule,
    SharedModule,
    HttpModule,
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    AuthService,
    BlingTokenService,
    BlingAuthService,
    {
      provide: 'IBlingTokenRepository',
      useClass: BlingTokenService,
    },
  ],
  exports: [
    JwtModule,
    AuthService,
    UsersModule,
  ],
})
export class AuthModule {}
