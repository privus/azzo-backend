import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';
import { BlingProductService } from '../services/bling-product.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService, private readonly blingService: BlingProductService) {}

  @ApiOperation({ summary: 'Sincronizar todos os produtos' })
  @Get('syncro')
  async syncroAllProducts() {
    return this.productsService.syncroProducts();
  }

  @ApiOperation({ summary: 'Atualizar preços por json' })
  @Get('updatePrices')
  async updatePricesFromJson() {
    return this.productsService.updatePricesFromJson();
  }

  @ApiOperation({ summary: 'Subir estoque minimo' })
  @Get('syncroMinStock')
  async syncroMinStock() {
    return this.productsService.updateStockMinimumFromJson();
  }

  @ApiOperation({ summary: 'Sincronizar todos os forncedores' })
  @Get('syncroSupplier')
  async syncroAllSupplier() {
    return this.productsService.syncroSupplier();
  }

  @ApiOperation({ summary: 'Sincronizar todos os ids Tiny' })
  @Get('syncroTiny')
  async syncroTiny() {
    return this.productsService.syncroTinyIds();
  }

  @ApiOperation({ summary: 'Sincronizar produtos Bling' })
  @Get('syncroBling/:fornecedor_id')
  async syncroBling(@Param('fornecedor_id') fornecedor_id: number) {
    return this.blingService.registerProducts(fornecedor_id);
  }

  @ApiOperation({ summary: 'Listar todos os produtos' })
  @Get()
  async findAllProducts() {
    return this.productsService.findAllProducts();
  }

  @ApiOperation({ summary: 'Salvar códigos Tiny.' })
  @Patch(':id/updateProduct')
  async updateProduct(
    @Param('id') id: number, 
    @Body() updateTinyDto: { tiny_mg: number; tiny_sp: number }) {
      const resultMessage = await this.productsService.updateProduct(id, updateTinyDto);
      return { message: resultMessage };
  }

  @ApiOperation({ summary: 'Buscar produto por Código' })
  @Get(':id')
  async findProductById(@Param('id') id: number) {
    return this.productsService.findProductById(id);
  }
}
