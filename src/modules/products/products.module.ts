import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';
import { CategoriaProduto, Fornecedor, Produto } from '../../infrastructure/database/entities';
import { BlingProductService } from './services/bling-product.service';
import { AuthModule } from '../auth/auth.module';
import { SellsModule } from '../sells/sells.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Produto, CategoriaProduto, Fornecedor]),
    HttpModule,
    AuthModule,
    SellsModule, 
  ],
  providers: [
    ProductsService,
    {
      provide: 'IProductsRepository',
      useExisting: ProductsService,
    },
    BlingProductService,
  ],
  controllers: [ProductsController],
  exports: ['IProductsRepository'],
})
export class ProductsModule {}


