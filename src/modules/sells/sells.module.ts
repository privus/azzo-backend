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
  Romaneio,
  Transportadora,
  SaidaEstoque,
  Montagem,
  ItensMontagem,
  MetaVendedor,
} from '../../infrastructure/database/entities';
import { SellsController } from './controllers/sells.controller';
import { HttpModule } from '@nestjs/axios';
import { CustomersModule } from '../customers/customers.module';
import { SellersModule } from '../sellers/sellers.module';
import { RegionsModule } from '../regions/regions.module';
import { TinyAuthService } from './services/tiny-auth.service';
import { TinyTokenService } from './services/tiny-token.service';
import { LabelService } from './services/label.service';
import { PrintOrderService } from './services/print-order.service';
import { RomaneioService } from './services/romaneio.service';
import { PrintOrderResumeService } from './services/print-order-resume.service';
import { OrderAssemblyService } from './services/order-assembly.service';
import { AssemblyController } from './controllers/assembly.controller';
import { OmieService } from './services/omie.service';
import { OmieController } from './controllers/omie.controller';
import { AuthModule } from '../auth/auth.module';

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
      Romaneio,
      Transportadora,
      SaidaEstoque,
      Montagem,
      ItensMontagem,
      MetaVendedor,
    ]),
    AuthModule,
    HttpModule,
    CustomersModule,
    SellersModule,
    RegionsModule,
  ],
  controllers: [SellsController, TinyAuthController, AssemblyController, OmieController],
  providers: [
    LabelService,
    PrintOrderService,
    SellsService,
    OmieService,
    TinyAuthService,
    TinyTokenService,
    RomaneioService,
    PrintOrderResumeService,
    OrderAssemblyService,
    { provide: 'ITinyAuthRepository', useClass: TinyAuthService },
    { provide: 'ITinyTokenRepository', useClass: TinyTokenService },
    { provide: 'ISellsRepository', useClass: SellsService },
  ],
  exports: [
    LabelService,
    PrintOrderService,
    PrintOrderResumeService,
    SellsService,
    TinyAuthService,
    TinyTokenService,
    'ITinyAuthRepository',
    'ITinyTokenRepository',
    'ISellsRepository',
  ],
})
export class SellsModule {}
