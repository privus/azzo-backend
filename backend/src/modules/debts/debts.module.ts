import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DebtsService } from './services/debts.service';
import { CategoriaDebito, Debito, Departamento, ParcelaDebito, StatusPagamento } from '../../infrastructure/database/entities';
import { DebtsController } from './controllers/debts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Debito, ParcelaDebito, StatusPagamento, Departamento, CategoriaDebito])],
  controllers: [DebtsController],
  providers: [DebtsService],
  exports: [DebtsService],
})
export class DebtsModule {}
