import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';
import { CategoriaProduto, Fornecedor, Produto } from '../../infrastructure/database/entities';
import { BlingProductService } from './services/bling-product.service';
import { BlingTokenService } from '../auth/services/bling-token.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Produto, CategoriaProduto, Fornecedor]),
    HttpModule,
    AuthModule,
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


