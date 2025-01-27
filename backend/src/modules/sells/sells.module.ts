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
} from '../../infrastructure/database/entities';
import { SellsController } from './controllers/sells.controller';
import { HttpModule } from '@nestjs/axios';
import { CustomersModule } from '../customers/customers.module';
import { SellersModule } from '../sellers/sellers.module';
import { RegionsModule } from '../regions/regions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venda, ParcelaCredito, Regiao, Produto, StatusPagamento, ItensVenda, StatusVenda, Syncro, TipoPedido]),
    RegionsModule,
    HttpModule,
    CustomersModule,
    SellersModule,
  ],
  controllers: [SellsController],
  providers: [SellsService, { provide: 'ISellsRepository', useClass: SellsService }],
  exports: [SellsService, 'ISellsRepository'],
})
export class SellsModule {}
