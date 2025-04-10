import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from './services/customers.service';
import { CustomersController } from './controllers/customers.controller';
import { CategoriaCliente, Cidade, Cliente, Estado, Regiao, StatusCliente, TinyTokens } from '../../infrastructure/database/entities';
import { HttpModule } from '@nestjs/axios';
import { TinyAuthService } from '../sells/services/tiny-auth.service';
import { TinyTokenService } from '../sells/services/tiny-token.service';
import { SellersService } from '../sellers/services/sellers.service';
import { SellersModule } from '../sellers/sellers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente, Cidade, Estado, Regiao, StatusCliente, TinyTokens, CategoriaCliente]), HttpModule, SellersModule],
  providers: [
    CustomersService, 
    { provide: 'ICustomersRepository', useClass: CustomersService }, 
    TinyAuthService, 
    { provide: 'ITinyAuthRepository', useClass: TinyAuthService }, 
    TinyTokenService,
    { provide: 'ITinyTokenRepository', useClass: TinyTokenService },
    SellersService,
    { provide: 'ISellersRepository', useClass: SellersService }, 
  ],
  controllers: [CustomersController],
  exports: [CustomersService, 'ICustomersRepository'],
})
export class CustomersModule {}
