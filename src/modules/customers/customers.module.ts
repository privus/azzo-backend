import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from './services/customers.service';
import { CustomersController } from './controllers/customers.controller';
import { Cidade, Cliente, Estado, Regiao, StatusCliente, TinyTokens } from '../../infrastructure/database/entities';
import { HttpModule } from '@nestjs/axios';
import { TinyAuthService } from '../sells/services/tiny-auth.service';
import { TinyTokenService } from '../sells/services/tiny-token.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente, Cidade, Estado, Regiao, StatusCliente, TinyTokens]), HttpModule],
  providers: [
    CustomersService, 
    { provide: 'ICustomersRepository', useClass: CustomersService }, 
    TinyAuthService, 
    { provide: 'ITinyAuthRepository', useClass: TinyAuthService }, 
    TinyTokenService,
    { provide: 'ITinyTokenRepository', useClass: TinyTokenService }, 
  ],
  controllers: [CustomersController],
  exports: [CustomersService, 'ICustomersRepository'],
})
export class CustomersModule {}
