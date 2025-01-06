import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SellersService } from '../services/sellers.service';

@ApiTags('sellers')
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @ApiOperation({ summary: 'Sincronizar todos os vendedores' })
  @Get('syncro')
  async syncroAllSellers() {
    return this.sellersService.syncroSellers();
  }

  //   @ApiOperation({ summary: 'Listar todos os vendedores' })
  //   @Get()
  //   async findAllSellers() {
  //     return this.sellersService.findAllSellers();
  //   }

  //   @ApiOperation({ summary: 'Buscar vendedor por Código' })
  //   @Get(':id')
  //   async findSellerById(@Param('id') id: number) {
  //     return this.sellersService.findSellerById(id);
  //   }
}
