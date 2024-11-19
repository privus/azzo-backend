import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as entities from './infrastructure/database/entities/index';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SharedModule } from './modules/shared/shared.module';
import { RolesModule } from './modules/roles/roles.module';

@Module({
  imports: [
    // Configuração do ConfigModule
    ConfigModule.forRoot({
      isGlobal: true, // Torna o módulo de configuração global
      envFilePath: '.env', // Caminho para o arquivo .env
    }),
    // Configuração assíncrona do TypeOrmModule
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Importa o ConfigModule
      inject: [ConfigService], // Injeta o ConfigService
      useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => ({
        type: 'mysql',
        host: 'mysql-container', // Nome do serviço MySQL no Docker Compose
        port: 3306,
        username: 'usuario',
        password: 'senha',
        database: 'meu_banco',
        entities: Object.values(entities), // Importa todas as entidades
        migrations: [__dirname + '/infrastructure/database/migrations/*.{ts,js}'],
        synchronize: true, // Use sincronização apenas para desenvolvimento
        logging: configService.get<string>('DB_LOGGING') === 'true', // Controle de logging via variável de ambiente
      }),
    }),
    // Registrando os repositórios
    TypeOrmModule.forFeature(Object.values(entities)),
    AuthModule,
    UsersModule,
    SharedModule,
    RolesModule,
    // Outros módulos podem ser adicionados aqui
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
