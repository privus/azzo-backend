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
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'mongodb',
        host: '152.53.39.254',
        port: 27017,
        database: 'azzo-database',
        password: 'privus123',
        username: 'azzo-user',
        useUnifiedTopology: true, // Recomendado para versões modernas do driver MongoDB
        synchronize: true, // Somente em dev
        entities: Object.values(entities),
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
