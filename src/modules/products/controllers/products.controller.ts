import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
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

  @ApiOperation({ summary: 'Associa caixas a unidade' })
  @Get('syncroCaixa')
  async syncroCaixa() {
    return this.productsService.associateCxtoUni();
  }

  @ApiOperation({ summary: 'Listar todos os produtos' })
  @Get()
  async findAllProducts() {
    return this.productsService.findAllProducts();
  }

  @ApiOperation({ summary: 'Salvar códigos Tiny.' })
  @Patch(':id/tiny-codes')
  async updateTinyCodes(
    @Param('id') id: number, 
    @Body() updateTinyDto: { tiny_mg: number; tiny_sp: number }) {
      const resultMessage = await this.productsService.updateTinyCodes(id, updateTinyDto);
      return { message: resultMessage };
  }

  @ApiOperation({ summary: 'Buscar produto por Código' })
  @Get(':id')
  async findProductById(@Param('id') id: number) {
    return this.productsService.findProductById(id);
  }
}
