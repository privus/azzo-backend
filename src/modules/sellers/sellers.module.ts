import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendedor, Regiao, Cidade, MetaVendedor, Venda, Cliente, HistoricoStatus } from '../../infrastructure/database/entities';
import { SellersController } from './controllers/sellers.controller';
import { SellersService } from './services/sellers.service';
import { HttpModule } from '@nestjs/axios';


@Module({
  imports: [TypeOrmModule.forFeature([Vendedor, Regiao, Cidade, MetaVendedor, Venda, Cliente, HistoricoStatus]), HttpModule],
  controllers: [SellersController],
  providers: [SellersService, { provide: 'ISellersRepository', useClass: SellersService }],
  exports: [SellersService, 'ISellersRepository', TypeOrmModule],
})
export class SellersModule {}
