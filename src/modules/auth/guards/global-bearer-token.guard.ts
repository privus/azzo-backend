import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

@Injectable()
export class GlobalBearerTokenGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Verifica se o endpoint está marcado para não requerer token
    const skipAuth = this.reflector.getAllAndOverride<boolean>(
      'skipAuth',
      [context.getHandler(), context.getClass()],
    );

    if (skipAuth) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Token de autorização não fornecido');
    }

    const token = authHeader.replace('Bearer ', '');
    const expectedToken = this.configService.get<string>('API_SECURITY_TOKEN');

    if (!expectedToken) {
      throw new UnauthorizedException('Token de segurança não configurado');
    }

    if (token !== expectedToken) {
      throw new UnauthorizedException('Token de autorização inválido');
    }

    return true;
  }
}
