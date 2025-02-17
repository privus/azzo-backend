import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditsService } from './services/credits.service';
import { CategoriaCredito, ParcelaCredito, StatusPagamento, Venda } from '../../infrastructure/database/entities';
import { CreditsController } from './controllers/credits.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ParcelaCredito, StatusPagamento, Venda, CategoriaCredito])],
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}
