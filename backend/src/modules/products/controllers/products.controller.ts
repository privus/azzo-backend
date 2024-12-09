import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IProductsRepository } from '../../../domain/repositories/products.repository.interface';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(@Inject('IProductsRepository') private readonly productsService: IProductsRepository) {}

  @ApiOperation({ summary: 'Sincronizar todos os produtos' })
  @Get('syncro')
  async syncroAllProducts() {
    return this.productsService.syncroProducts();
  }

  @ApiOperation({ summary: 'Listar todos os produtos' })
  @Get()
  async findAllProducts() {
    return this.productsService.findAllProducts();
  }
}
