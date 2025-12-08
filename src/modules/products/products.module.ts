import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';
import { CategoriaProduto, Fornecedor, Produto, ItensVenda } from '../../infrastructure/database/entities';
import { BlingProductService } from './services/bling-product.service';
import { AuthModule } from '../auth/auth.module';
import { SellsModule } from '../sells/sells.module';
import { TinyProductService } from './services/tiny-product.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Produto, CategoriaProduto, Fornecedor, ItensVenda]),
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
    TinyProductService
  ],
  controllers: [ProductsController],
  exports: ['IProductsRepository'],
})
export class ProductsModule {}


