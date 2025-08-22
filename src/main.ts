import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import * as cors from 'cors';
import * as express from 'express';
import { GlobalBearerTokenGuard } from './modules/auth/guards/global-bearer-token.guard';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

async function bootstrap() {
  process.env.TZ = 'America/Sao_Paulo';
  console.log('Fuso horário atual:', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  const app = await NestFactory.create(AppModule);

  const logger = new Logger('Bootstrap');

  const allowedOrigins = ['http://localhost:4200', 'https://geecom.com.br'];

  const uploadsPath = join(__dirname, '..', 'uploads');

  // ⚠️ Primeiro CORS com rota estática
  app.use('/uploads', cors({ origin: allowedOrigins, credentials: true }), express.static(uploadsPath));
  
  // Depois, global CORS para rotas da API
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );
  

  app.useGlobalPipes(new ValidationPipe());
  
  // Aplicar guard global de bearer token
  app.useGlobalGuards(new GlobalBearerTokenGuard(app.get(ConfigService), app.get(Reflector)));
  
  // Configuração do Swagger (opcional)
  const config = new DocumentBuilder()
    .setTitle('API Azzo')
    .setDescription('API para criação de usuários e autenticação')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT);
  logger.log(`Aplicação rodando em: http://localhost:${process.env.PORT}`);
  logger.log(`Swagger disponível em: http://localhost:${process.env.PORT}/api-docs`);
}
bootstrap();
