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
import { ProductsModule } from './modules/products/products.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { SellsModule } from './modules/sells/sells.module';
import { RegionsModule } from './modules/regions/regions.module';
import { DebtsModule } from './modules/debts/debts.module';
import { CreditsModule } from './modules/credits/credits.module';

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
        host: '152.53.39.254', // Nome do serviço MySQL no Docker Compose
        port: 27017,
        username: 'azzo-user',
        password: 'privus123',
        database: 'azzo-database',
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
    ProductsModule,
    CustomersModule,
    SellersModule,
    SellsModule,
    RegionsModule,
    DebtsModule,
    CreditsModule,
    // Outros módulos podem ser adicionados aqui
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
