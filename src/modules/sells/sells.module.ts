import { TinyAuthController } from './controllers/tiny-auth.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellsService } from './services/sells.service';
import {
  ParcelaCredito,
  Produto,
  Regiao,
  StatusPagamento,
  Venda,
  ItensVenda,
  StatusVenda,
  Syncro,
  TipoPedido,
  TinyTokens,
} from '../../infrastructure/database/entities';
import { SellsController } from './controllers/sells.controller';
import { HttpModule } from '@nestjs/axios';
import { CustomersModule } from '../customers/customers.module';
import { SellersModule } from '../sellers/sellers.module';
import { RegionsModule } from '../regions/regions.module';
import { TinyAuthService } from './services/tiny-auth.service';
import { TinyTokenService } from './services/tiny-token.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Venda,
      ParcelaCredito,
      Regiao,
      Produto,
      StatusPagamento,
      ItensVenda,
      StatusVenda,
      Syncro,
      TipoPedido,
      TinyTokens,
    ]),
    HttpModule,
    CustomersModule,
    SellersModule,
    RegionsModule,
  ],
  controllers: [SellsController, TinyAuthController],
  providers: [
    SellsService,
    TinyAuthService,
    TinyTokenService,
    { provide: 'ITinyAuthRepository', useClass: TinyAuthService },
    { provide: 'ITinyTokenRepository', useClass: TinyTokenService },
    { provide: 'ISellsRepository', useClass: SellsService },
  ],
  exports: [
    SellsService,
    TinyAuthService, // ✅ Agora exporta a autenticação para outros módulos
    TinyTokenService, // ✅ Agora exporta o gerenciamento de tokens para outros módulos
    'ITinyAuthRepository',
    'ITinyTokenRepository',
    'ISellsRepository',
  ],
})
export class SellsModule {}
