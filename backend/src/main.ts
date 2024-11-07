import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Domínios permitidos
  const allowedOrigins = [
    'http://localhost:4200', // Para desenvolvimento local
    'http://172.18.0.4:4200', // Endereço interno do container
    'http://54.233.159.54', // Endereço do frontend de produção
  ];

  // Configuração do CORS
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Ativar validação global
  app.useGlobalPipes(new ValidationPipe());

  // Configuração do Swagger (opcional)
  const config = new DocumentBuilder()
    .setTitle('API Azzo')
    .setDescription('API para criação de usuários e autenticação')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Iniciar aplicação
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Aplicação rodando em: http://localhost:${port}`);
  logger.log(`Swagger disponível em: http://localhost:${port}/api-docs`);
}

bootstrap();
