import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';
import { CategoriaProduto, Fornecedor, Produto } from '../../infrastructure/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Produto, CategoriaProduto, Fornecedor]), HttpModule],
  providers: [
    ProductsService,
    {
      provide: 'IProductsRepository',
      useExisting: ProductsService,
    },
  ],
  controllers: [ProductsController],
  exports: ['IProductsRepository'],
})
export class ProductsModule {}


