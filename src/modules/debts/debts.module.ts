import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DebtsService } from './services/debts.service';
import { Account, CategoriaDebito, Company, Debito, Departamento, ParcelaDebito, RateioDebito, StatusPagamento } from '../../infrastructure/database/entities';
import { DebtsController } from './controllers/debts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Debito, ParcelaDebito, StatusPagamento, Departamento, CategoriaDebito, Account, Company, RateioDebito])],
  controllers: [DebtsController],
  providers: [DebtsService, { provide: 'IDebtsRepository', useClass: DebtsService }],
  exports: [DebtsService, 'IDebtsRepository'],
})
export class DebtsModule {}
