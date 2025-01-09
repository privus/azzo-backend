import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegionsService } from './services/regions.service';
import { Regiao, Cidade, Cliente, Vendedor, Venda } from '../../infrastructure/database/entities';
import { RegionsController } from './controllers/regions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Regiao, Cidade, Cliente, Vendedor, Venda])],
  controllers: [RegionsController],
  providers: [RegionsService],
  exports: [RegionsService],
})
export class RegionsModule {}
