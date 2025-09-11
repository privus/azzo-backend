
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cidade, PCliente, PEcommerce, PFormaPagamento, PItensVenda, PParcelaCredito, PProduto, PSell, PStatusCliente, PStatusVenda, PVenda, PVendedor, StatusPagamento } from '../../infrastructure/database/entities';
import { HttpModule } from '@nestjs/axios';
import { PSellsController } from './controllers/p-sells.controller';
import { PSellsService } from './services/p-sell.service';
import { OmieService } from './services/omie.service';

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
      Cidade,
      PVendedor
    ]),
    HttpModule,
  ],
  controllers: [PSellsController],
  providers: [PSellsService, OmieService],
  exports: [PSellsService],
})
export class PSellsModule {}
