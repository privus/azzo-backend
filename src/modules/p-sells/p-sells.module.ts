
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cidade, PCliente, PEcommerce, PFormaPagamento, PItensVenda, PParcelaCredito, PProduto, PSell, PStatusCliente, PStatusVenda, PVenda, StatusPagamento } from '../../infrastructure/database/entities';
import { HttpModule } from '@nestjs/axios';
import { PSellsController } from './controllers/p-sells.controller';
import { PSellsService } from './services/p-sell.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PVenda,
      PParcelaCredito,
      PProduto,
      StatusPagamento,
      PItensVenda,
      PStatusVenda,
      PCliente,
      PStatusCliente,
      PFormaPagamento,
      PSell,
      PStatusVenda,
      PEcommerce, 
      Cidade     
    ]),
    HttpModule,
  ],
  controllers: [PSellsController],
  providers: [PSellsService],
  exports: [PSellsService],
})
export class PSellsModule {}
