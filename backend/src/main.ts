import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as cors from 'cors';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Configurar CORS
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:4200',
      credentials: true,
    }),
  );

  // Configuração do Swagger (opcional)
  const config = new DocumentBuilder()
    .setTitle('API da Aplicação')
    .setDescription('Descrição da API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT || 3000);
  logger.log(`Aplicação rodando em: http://localhost:${process.env.PORT || 3000}`);
  logger.log(`Swagger disponível em: http://localhost:${process.env.PORT || 3000}/api-docs`);
}
bootstrap();
