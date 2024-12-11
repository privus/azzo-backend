import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

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

  @ApiOperation({ summary: 'Buscar produto por Código' })
  @Get(':id')
  async findProductById(@Param('id') codigo: number) {
    return this.productsService.findProductById(codigo);
  }
}
