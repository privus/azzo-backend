import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Distribuidor, Estoque, Fornecedor, SaidaEstoque, TinyTokens } from '../../infrastructure/database/entities';
import { StockService } from './services/stock.service';
import { ProductsModule } from '../products/products.module';
import { TinyTokenService } from '../sells/services/tiny-token.service';
import { SellsModule } from '../sells/sells.module';
import { StockController } from './controllers/stock.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Estoque, TinyTokens, Fornecedor, Distribuidor, SaidaEstoque]),
    HttpModule,
    ProductsModule,
    SellsModule,
  ],
  providers: [
    StockService,
    { provide: 'IStockRepository', useClass: StockService },
    { provide: 'ITinyTokenRepository', useClass: TinyTokenService },
  ],
  controllers: [StockController],
  exports: ['IStockRepository', StockService],
})
export class StockModule {}


