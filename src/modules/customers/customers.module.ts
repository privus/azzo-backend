import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from './services/customers.service';
import { CustomersController } from './controllers/customers.controller';
import { Cidade, Cliente, Estado, Regiao, StatusCliente } from '../../infrastructure/database/entities';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente, Cidade, Estado, Regiao, StatusCliente]), HttpModule],
  providers: [CustomersService, { provide: 'ICustomersRepository', useClass: CustomersService }],
  controllers: [CustomersController],
  exports: [CustomersService, 'ICustomersRepository'],
})
export class CustomersModule {}
