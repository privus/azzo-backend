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
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    // Configuração do ConfigModule
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Configuração assíncrona do TypeOrmModule
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Importa o ConfigModule
      inject: [ConfigService], // Injeta o ConfigService
      useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: Object.values(entities), // Importa todas as entidades
        migrations: [__dirname + '/infrastructure/database/migrations/*.{ts,js}'],
        synchronize: configService.get<boolean>('DB_SYNC', false),
        logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
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
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
