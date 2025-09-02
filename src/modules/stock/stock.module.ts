import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Distribuidor, Estoque, Fornecedor, HistoricoEstoque, Produto, SaidaEstoque, TinyTokens, ValorEstoque } from '../../infrastructure/database/entities';
import { StockService } from './services/stock.service';
import { ProductsModule } from '../products/products.module';
import { TinyTokenService } from '../sells/services/tiny-token.service';
import { SellsModule } from '../sells/sells.module';
import { StockController } from './controllers/stock.controller';
import { DebtsModule } from '../debts/debts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Estoque, TinyTokens, Fornecedor, Distribuidor, SaidaEstoque, Produto, ValorEstoque, HistoricoEstoque]),
    HttpModule,
    ProductsModule,
    SellsModule,
    DebtsModule,
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


