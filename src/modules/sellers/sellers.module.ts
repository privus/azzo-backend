import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendedor, Regiao, Cidade } from '../../infrastructure/database/entities';
import { SellersController } from './controllers/sellers.controller';
import { SellersService } from './services/sellers.service';
import { HttpModule } from '@nestjs/axios';
import { SellsModule } from '../sells/sells.module';

@Module({
  imports: [TypeOrmModule.forFeature([Vendedor, Regiao, Cidade]), HttpModule],
  controllers: [SellersController],
  providers: [SellersService, { provide: 'ISellersRepository', useClass: SellersService }],
  exports: [SellersService, 'ISellersRepository'],
})
export class SellersModule {}
