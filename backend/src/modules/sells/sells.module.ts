import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellsService } from './services/sells.service';
import { Cliente, ParcelaCredito, Produto, Regiao, StatusPagamento, Venda, ItensVenda, Vendedor } from '../../infrastructure/database/entities';
import { SellsController } from './controllers/sells.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([Venda, Vendedor, ParcelaCredito, Regiao, Cliente, Produto, StatusPagamento, ItensVenda]), HttpModule],
  controllers: [SellsController],
  providers: [SellsService],
  exports: [SellsService],
})
export class SellsModule {}
