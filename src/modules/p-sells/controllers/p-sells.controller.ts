import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Query, Patch, Body, Param } from '@nestjs/common';
import { PSellsService } from '../services/p-sell.service';

@ApiTags('pSells')
@Controller('pSells')
export class PSellsController {
  constructor(private readonly pSellsService: PSellsService) {}

  @ApiOperation({ summary: 'Vendas por data' })
  @Get()
  async sellsByDate(@Query('fromDate') fromDate?: string) {
    return this.pSellsService.sellsByDate(fromDate);
  }

  @ApiOperation({ summary: 'Sincroniza com a tabela pSell' })
  @Get('syncro')
  async relatationsSells() {
    return this.pSellsService.createSells();
  }

  @ApiOperation({ summary: 'Obter venda por ID' })
  @Get(':id')
  async getSellById(@Param('id') id: number) {
    return this.pSellsService.getSellById(id);
  }
}