import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Query, Patch, Body } from '@nestjs/common';
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

  @ApiOperation({ summary: 'Vendas por data' })
  @Get('syncro')
  async relatationsSells() {
    return this.pSellsService.createSells();
  }
}