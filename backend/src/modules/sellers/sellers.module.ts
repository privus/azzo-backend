import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendedor, Regiao, Cidade } from '../../infrastructure/database/entities';
import { SellersController } from './controllers/sellers.controller';
import { SellersService } from './services/sellers.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([Vendedor, Regiao, Cidade]), HttpModule],
  controllers: [SellersController],
  providers: [SellersService],
  exports: [SellersService],
})
export class SellersModule {}
