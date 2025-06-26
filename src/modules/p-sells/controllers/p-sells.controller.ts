import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Query, Patch, Body } from '@nestjs/common';
import { PSellsService } from '../services/p-sell.service';

@ApiTags('p-sells')
@Controller('p-sells')
export class PSellsController {
  constructor(private readonly pSellsService: PSellsService) {}

  @ApiOperation({ summary: 'Vendas por data' })
  @Get('syncro')
  async sellsByDate() {
    return this.pSellsService.createSells();
  }
}