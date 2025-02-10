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
      useFactory: async (configService: ConfigService) => ({
        type: 'mongodb',
        host: configService.get<string>('MONGO_HOST', '152.53.39.254'),
        port: configService.get<number>('MONGO_PORT', 27017),
        database: configService.get<string>('MONGO_DATABASE', 'azzo-database'),
        username: configService.get<string>('MONGO_USER'),
        password: configService.get<string>('MONGO_PASS'),
        synchronize: true,
        useUnifiedTopology: true,
        entities: [__dirname + '/infrastructure/database/entities/**/*.entity{.ts,.js}'],
      }),
      inject: [ConfigService],
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
